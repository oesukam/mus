import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsEnum, IsOptional, MaxLength, IsObject, IsInt, Min, Max } from 'class-validator';
import { FeatureFlagScope } from '../entities/feature-flag.entity';

export class CreateFeatureFlagDto {
  @ApiProperty({
    example: 'new-checkout',
    description: 'Unique key for the feature flag (kebab-case recommended)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @ApiProperty({
    example: 'New Checkout Experience',
    description: 'Display name of the feature flag',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  displayName: string;

  @ApiPropertyOptional({
    example: 'Enable the new checkout flow with improved UX',
    description: 'Description of what this feature flag controls',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the feature is enabled',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    example: FeatureFlagScope.GLOBAL,
    description: 'The scope of the feature flag',
    enum: FeatureFlagScope,
    default: FeatureFlagScope.GLOBAL,
  })
  @IsEnum(FeatureFlagScope)
  @IsOptional()
  scope?: FeatureFlagScope;

  @ApiPropertyOptional({
    example: { userIds: [1, 2, 3], roleNames: ['admin'] },
    description: 'Rules for scoped feature flags (used when scope is not global)',
  })
  @IsObject()
  @IsOptional()
  rules?: Record<string, any>;

  @ApiPropertyOptional({
    example: 50,
    description: 'Percentage of users to enable this feature for (0-100). Only used when scope is PERCENTAGE',
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  rolloutPercentage?: number;
}
