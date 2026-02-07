import { Injectable, ExecutionContext } from "@nestjs/common"
import { AuthGuard } from "@nestjs/passport"

/**
 * Optional JWT Auth Guard
 * Validates JWT token if present, but allows requests without authentication
 * Used for endpoints that support both authenticated and guest users
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  /**
   * Override handleRequest to not throw error when no token is provided
   */
  handleRequest(err: any, user: any, _info: any, _context: ExecutionContext) {
    // If there's an error or no user, just return null instead of throwing
    // This allows the request to continue without authentication
    if (err || !user) {
      return null
    }
    return user
  }

  /**
   * Override canActivate to always return true
   * Authentication is optional, so the guard always allows the request through
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to authenticate, but don't fail if it doesn't work
      await super.canActivate(context)
    } catch {
      // Silently fail - request can proceed without auth
    }
    return true
  }
}
