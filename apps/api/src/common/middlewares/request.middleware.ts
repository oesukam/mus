import { Response, NextFunction } from "express"
import { Injectable, NestMiddleware } from "@nestjs/common"
import dayjs from "dayjs"
import { v4 as uuidv4 } from "uuid"
import tracer from "dd-trace"
import { CustomRequest } from "../types/custom-request"
import { detectUserAgent } from "../utils/detect-user-agent"
import { objectMask } from "../utils/object-mask"
import { maskedRequestHeader, maskedRequestBody } from "../constants/env"
import { CustomLoggerService } from "../services/logger.service"

@Injectable()
export class RequestMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLoggerService) {}
  async use(request: CustomRequest, response: Response, next: NextFunction): Promise<void> {
    const { method, originalUrl: url, body, hostname, headers } = request
    const userAgent = request.get("user-agent") || ""
    const requestId = (request?.headers?.["cf-ray"] || uuidv4()) as string
    const clientRequestId = (request.headers?.["x-client-request-id"] as string) || null

    const logPayload = {
      clientRequestId,
      requestId,
    }

    const span = tracer.startSpan("requests", {
      tags: {
        clientRequestId,
        requestId,
      },
    })

    // Ensure span is always finished when response completes
    response.on("finish", () => {
      span.finish()
    })

    const startDateTime = dayjs()

    const requestUserAgent = detectUserAgent(request)

    request.clientRequestId = clientRequestId
    request.requestId = requestId

    const send = response.send
    response.send = (responseString) => {
      try {
        const baseUrl = response.req.baseUrl || ""
        const routePath = response.req.route?.path || request.path
        const urlPath = `${baseUrl}${routePath}`
        const { statusCode } = response
        const responseTime = dayjs().diff(startDateTime, "millisecond")

        let responseData

        try {
          responseData = JSON.parse(responseString)
        } catch (error) {
          this.logger.error(`failed to parse response data: ${error.message} ${error.stack}`, {
            error,
            url,
          })
        }

        const contentLength = response?.getHeader("content-length") || responseString?.length || 0

        const message = `${method} ${url} - ${statusCode} [${responseTime}ms] [${contentLength} bytes] ${userAgent}`

        const messagePayload = {
          ...requestUserAgent,
          ...logPayload,
          url,
          urlPath,
          requestMethod: method,
          requestQuery: objectMask(request.query || {}, []),
          requestHostname: hostname,
          requestHeaders: objectMask(headers || {}, [...maskedRequestHeader]),
          requestBody: objectMask(body || {}, [...maskedRequestBody]),
          responseTime,
          responseBody: {
            ...logPayload,
            statusCode,
            ...objectMask(responseData || {}, [...maskedRequestBody]),
          },
        }

        if (statusCode >= 400) {
          this.logger.error(message, messagePayload)
        } else {
          this.logger.info(message, messagePayload)
        }

        response.send = send
        return response.send(responseString)
      } catch (error) {
        this.logger.error(`AppLoggerMiddleware error: ${error.message} stack:${error?.stack}`, {
          error,
        })
      }
    }

    next()
  }
}
