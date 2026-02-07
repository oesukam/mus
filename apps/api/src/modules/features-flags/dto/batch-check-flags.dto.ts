import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class BatchCheckFlagsDto {
  @ApiProperty({
    example: ['new-checkout', 'advanced-analytics', 'beta-features'],
    description: 'Array of feature flag keys to check (max 20)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  keys: string[];
}

export class BatchCheckResultDto {
  @ApiProperty({
    example: {
      'new-checkout': true,
      'advanced-analytics': false,
      'beta-features': true,
    },
    description: 'Map of feature flag keys to their enabled state',
  })
  flags: Record<string, boolean>;
}
