import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common"
import { Response } from "express"
import { ERROR_CODES } from "../constants/error-codes"

export interface HttpExceptionResponse {
  statusCode: number
  message: string | string[]
  error?: string
  errorCode?: string
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const status = exception.getStatus()
    const exceptionResponse = exception.getResponse() as HttpExceptionResponse

    const errorCode = this.getErrorCode(status, exceptionResponse)
    const message =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : exceptionResponse.message || exceptionResponse.error || "An error occurred"

    response.status(status).json({
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      ...(Array.isArray(message) && { errors: message }),
    })
  }

  private getErrorCode(status: number, response: HttpExceptionResponse): string {
    // Check if error code is already provided in the exception
    if (response.errorCode) {
      return response.errorCode
    }

    console.log(status, "=========status=========")
    // Map status codes to error codes
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHORIZED
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.RESOURCE_NOT_FOUND
      case HttpStatus.CONFLICT:
        return ERROR_CODES.RESOURCE_ALREADY_EXISTS
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.VALIDATION_ERROR
      case HttpStatus.TOO_MANY_REQUESTS:
        return ERROR_CODES.RATE_LIMIT_EXCEEDED
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ERROR_CODES.INTERNAL_SERVER_ERROR
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.INSUFFICIENT_PERMISSIONS
      default:
        return ERROR_CODES.INTERNAL_SERVER_ERROR
    }
  }
}
