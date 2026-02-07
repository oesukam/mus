import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common"
import logger from "../utils/winston-logger"

interface GetContextResponse {
  contextName: string
}
@Injectable()
export class CustomLoggerService implements NestLoggerService {
  private getContext(): GetContextResponse {
    const stack = new Error().stack
    const context = stack?.split("\n")[3].trim()
    const contextName = context ? context.split(" ")[1] : "Application"

    return { contextName }
  }

  info(message: string, ...optionalParams: any[]) {
    const { contextName } = this.getContext()
    logger.info(`[${contextName}] [INFO] ${message}`, ...(optionalParams ?? []))
  }

  log(message: string, ...optionalParams: any[]) {
    const { contextName } = this.getContext()
    logger.info(`[${contextName}] [LOG] ${message}`, ...(optionalParams ?? []))
  }

  error(message: string, ...optionalParams: any[]) {
    const { contextName } = this.getContext()
    logger.error(`[${contextName}] [ERROR] ${message}`, ...(optionalParams ?? []))
  }

  warn(message: string, ...optionalParams: any[]) {
    const { contextName } = this.getContext()
    logger.warn(`[${contextName}] [WARNING] ${message}`, ...(optionalParams ?? []))
  }

  debug(message: string, ...optionalParams: any[]) {
    const { contextName } = this.getContext()
    logger.debug(`[${contextName}] [DEBUG] ${message}`, ...(optionalParams ?? []))
  }

  verbose(message: string, ...optionalParams: any[]) {
    const { contextName } = this.getContext()
    logger.verbose(`[${contextName}] [VERBOSE] ${message}`, ...(optionalParams ?? []))
  }
}
