import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { FEATURE_FLAG_KEY } from "../decorators/requires-feature.decorator"
import { FeatureFlagService } from "../feature-flag.service"
import { User } from "../../users/entities/user.entity"

/**
 * Guard that checks if a required feature flag is enabled
 * Use with @RequiresFeature decorator
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private featureFlagsService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const featureFlagKey = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    // If no feature flag is required, allow access
    if (!featureFlagKey) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as User | undefined

    // Check if the feature is enabled for this user
    const isEnabled = await this.featureFlagsService.isFeatureEnabled(featureFlagKey, user)

    if (!isEnabled) {
      throw new ForbiddenException(
        `This feature is not available. Feature flag "${featureFlagKey}" is not enabled.`,
      )
    }

    return true
  }
}
