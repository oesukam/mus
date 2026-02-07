import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { FeatureFlagGuard } from '../guards/feature-flag.guard';

export const FEATURE_FLAG_KEY = 'feature_flag';

/**
 * Decorator to mark routes that require a specific feature flag to be enabled.
 * Automatically applies the FeatureFlagGuard - no need to use @UseGuards separately!
 *
 * @example
 * ```typescript
 * @Get('new-feature')
 * @RequiresFeature('new-checkout')
 * async newCheckout() {
 *   // This endpoint is only accessible if 'new-checkout' feature flag is enabled
 *   // Guard is automatically applied!
 * }
 * ```
 *
 * @example Using with constants for type safety
 * ```typescript
 * import { FEATURE_FLAG_KEYS } from './constants/feature-flag-keys';
 *
 * @Get('beta-feature')
 * @RequiresFeature(FEATURE_FLAG_KEYS.BETA_FEATURES)
 * async betaFeature() {
 *   // Type-safe feature flag key with autocomplete
 * }
 * ```
 */
export const RequiresFeature = (featureFlagKey: string) => {
  return applyDecorators(
    SetMetadata(FEATURE_FLAG_KEY, featureFlagKey),
    UseGuards(FeatureFlagGuard),
  );
};
