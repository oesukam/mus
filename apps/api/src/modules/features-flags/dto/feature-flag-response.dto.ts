import { ApiProperty } from '@nestjs/swagger';
import { FeatureFlag } from '../entities/feature-flag.entity';

export class FeatureFlagResponseDto {
  @ApiProperty({
    description: 'Feature flag object',
    type: FeatureFlag,
  })
  featureFlag: FeatureFlag;
}

export class FeatureFlagsResponseDto {
  @ApiProperty({
    description: 'Array of feature flags',
    type: [FeatureFlag],
  })
  featureFlags: FeatureFlag[];
}

export class FeatureFlagStateDto {
  @ApiProperty({
    example: 'new-checkout',
    description: 'The feature flag key',
  })
  key: string;

  @ApiProperty({
    example: true,
    description: 'Whether the feature is enabled for the current context',
  })
  isEnabled: boolean;
}
