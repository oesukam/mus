import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * User-Agent decorator
 * Extracts the User-Agent header from the request
 *
 * @example
 * ```typescript
 * @Get('products')
 * async getProducts(@UserAgent() userAgent: string) {
 *   console.log('Request from:', userAgent)
 *   // => "MUS-Platform/0.1.0 (Next.js; Server)"
 * }
 * ```
 */
export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest()
    return request.headers['user-agent']
  },
)

/**
 * Parse User-Agent string to extract platform information
 */
export interface ParsedUserAgent {
  platform?: string
  version?: string
  framework?: string
  runtime?: 'Server' | 'Browser'
  raw: string
}

/**
 * Helper function to parse MUS Platform User-Agent string
 *
 * @param userAgent - The User-Agent header string
 * @returns Parsed User-Agent information
 *
 * @example
 * ```typescript
 * const ua = parseUserAgent('MUS-Platform/0.1.0 (Next.js; Server)')
 * // {
 * //   platform: 'MUS-Platform',
 * //   version: '0.1.0',
 * //   framework: 'Next.js',
 * //   runtime: 'Server',
 * //   raw: 'MUS-Platform/0.1.0 (Next.js; Server)'
 * // }
 * ```
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const result: ParsedUserAgent = { raw: userAgent }

  // Match pattern: "Platform/Version (Framework; Runtime)"
  const match = userAgent.match(/^([^\/]+)\/([^\s]+)\s*\(([^;]+);\s*([^)]+)\)/)

  if (match) {
    result.platform = match[1]
    result.version = match[2]
    result.framework = match[3]
    result.runtime = match[4] as 'Server' | 'Browser'
  }

  return result
}
