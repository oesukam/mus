import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { ROLES_KEY } from "../decorators/roles.decorator"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new ForbiddenException("User not authenticated")
    }

    if (!user.roles || !Array.isArray(user.roles)) {
      throw new ForbiddenException("User has no roles assigned")
    }

    const hasRole = requiredRoles.some((role) => user.roles.some((r) => r.name === role))

    if (!hasRole) {
      throw new ForbiddenException(
        `User does not have the required role(s): ${requiredRoles.join(", ")}`,
      )
    }

    return true
  }
}
