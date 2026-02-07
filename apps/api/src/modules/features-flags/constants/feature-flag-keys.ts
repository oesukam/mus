/**
 * Known feature flag keys used throughout the application
 *
 * Benefits:
 * - Type safety and autocomplete in application code
 * - Prevents typos when using flags
 * - Central reference for all feature flags
 * - Easier refactoring
 *
 * Note: The API still accepts any string for flexibility.
 * These constants are for use in application code only.
 */
export const FEATURE_FLAG_KEYS = {
  // Checkout & Payment Features
  NEW_CHECKOUT: 'new-checkout',

  // Analytics & Reporting
  ADVANCED_ANALYTICS: 'advanced-analytics',

  // Beta Features
  BETA_FEATURES: 'beta-features',

  // Gradual Rollout Features
  GRADUAL_ROLLOUT_FEATURE: 'gradual-rollout-feature',

  // Add more as needed...
} as const;

/**
 * Type representing all known feature flag keys
 */
export type FeatureFlagKey = typeof FEATURE_FLAG_KEYS[keyof typeof FEATURE_FLAG_KEYS];

/**
 * Helper to check if a string is a known feature flag key
 */
export function isKnownFeatureFlagKey(key: string): key is FeatureFlagKey {
  return Object.values(FEATURE_FLAG_KEYS).includes(key as FeatureFlagKey);
}
