import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleFeatureFlagDto {
  @ApiProperty({
    example: true,
    description: 'Whether to enable or disable the feature flag',
  })
  @IsBoolean()
  @IsNotEmpty()
  isEnabled: boolean;
}
