import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { parseUserAgent } from '../decorators/user-agent.decorator'

/**
 * User-Agent Logging Interceptor
 * Logs incoming requests with their User-Agent information
 *
 * Usage:
 * 1. Apply globally in main.ts:
 *    app.useGlobalInterceptors(new UserAgentLoggerInterceptor())
 *
 * 2. Apply to specific controllers:
 *    @UseInterceptors(UserAgentLoggerInterceptor)
 *    @Controller('products')
 *    export class ProductsController { ... }
 *
 * 3. Apply to specific routes:
 *    @UseInterceptors(UserAgentLoggerInterceptor)
 *    @Get()
 *    async findAll() { ... }
 */
@Injectable()
export class UserAgentLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UserAgentLoggerInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const userAgent = request.headers['user-agent'] || 'Unknown'
    const method = request.method
    const url = request.url
    const ip = request.ip || request.connection.remoteAddress

    // Parse User-Agent if it's from MUS Platform
    const parsedUA = parseUserAgent(userAgent)

    const now = Date.now()

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now

          // Log with structured data
          this.logger.log({
            message: 'Request processed',
            method,
            url,
            ip,
            responseTime: `${responseTime}ms`,
            userAgent: parsedUA.platform ? {
              platform: parsedUA.platform,
              version: parsedUA.version,
              runtime: parsedUA.runtime,
            } : userAgent,
          })
        },
        error: (error) => {
          const responseTime = Date.now() - now

          this.logger.error({
            message: 'Request failed',
            method,
            url,
            ip,
            responseTime: `${responseTime}ms`,
            userAgent: parsedUA.platform ? {
              platform: parsedUA.platform,
              version: parsedUA.version,
              runtime: parsedUA.runtime,
            } : userAgent,
            error: error.message,
          })
        },
      }),
    )
  }
}
