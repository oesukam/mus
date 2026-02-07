import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../guards/optional-jwt-auth.guard';

/**
 * Metadata key for optional authentication
 */
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

/**
 * Combined decorator for optional authentication
 * Automatically applies OptionalJwtAuthGuard and sets metadata to bypass global auth
 *
 * This decorator:
 * 1. Tells the global JwtAuthGuard to bypass authentication
 * 2. Applies OptionalJwtAuthGuard to extract user info when token is present
 * 3. Adds Swagger @ApiBearerAuth for API documentation
 *
 * Usage:
 * @OptionalAuth()
 * async create(@Request() req) {
 *   const userId = req.user?.userId || null; // userId will be null for guests
 * }
 */
export const OptionalAuth = () => applyDecorators(
  SetMetadata(IS_OPTIONAL_AUTH_KEY, true),
  UseGuards(OptionalJwtAuthGuard),
  ApiBearerAuth(),
);
