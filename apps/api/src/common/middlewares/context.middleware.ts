import { Injectable, NestMiddleware } from "@nestjs/common"
import { Request, Response, NextFunction } from "express"
import { v4 as uuid } from "uuid"
import { CustomRequest } from "../types/custom-request"
import { detectUserAgent } from "../utils/detect-user-agent"
import { RequestContext } from "../utils/request-context"

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req?.headers?.["cf-ray"] as string) || uuid()
    const clientRequestId = req.headers?.["x-client-request-id"] as string
    const { origin } = req?.headers || {}
    const requestUserAgent = detectUserAgent(req as CustomRequest)

    const context = {
      logPayload: {
        ...requestUserAgent,
        origin,
        requestId,
        clientRequestId,
        serviceRequestId: requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
      },
      request: req,
    }

    RequestContext.run(context, () => {
      next()
    })
  }
}
