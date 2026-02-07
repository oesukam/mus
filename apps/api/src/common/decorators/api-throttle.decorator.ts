import { applyDecorators } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

/**
 * Apply custom rate limiting to endpoints
 * @param ttl - Time to live in milliseconds
 * @param limit - Number of requests allowed in the TTL window
 */
export function ApiThrottle(ttl: number, limit: number) {
  return applyDecorators(
    Throttle({ default: { ttl, limit } })
  );
}

/**
 * Strict rate limit for sensitive operations (e.g., auth)
 * 5 requests per minute
 */
export function StrictThrottle() {
  return ApiThrottle(60000, 5);
}

/**
 * Moderate rate limit for regular API calls
 * 20 requests per 10 seconds
 */
export function ModerateThrottle() {
  return ApiThrottle(10000, 20);
}

/**
 * Relaxed rate limit for public read operations
 * 100 requests per minute
 */
export function RelaxedThrottle() {
  return ApiThrottle(60000, 100);
}
