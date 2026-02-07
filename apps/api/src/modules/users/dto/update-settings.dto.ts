import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class NotificationSettingsDto {
  @ApiProperty({ example: true, description: 'Receive order update notifications', required: false })
  @IsOptional()
  @IsBoolean()
  orderUpdates?: boolean;

  @ApiProperty({ example: true, description: 'Receive promotional notifications', required: false })
  @IsOptional()
  @IsBoolean()
  promotions?: boolean;

  @ApiProperty({ example: true, description: 'Receive wishlist alert notifications', required: false })
  @IsOptional()
  @IsBoolean()
  wishlistAlerts?: boolean;

  @ApiProperty({ example: false, description: 'Subscribe to newsletter', required: false })
  @IsOptional()
  @IsBoolean()
  newsletter?: boolean;
}

class PrivacySettingsDto {
  @ApiProperty({ example: true, description: 'Show profile publicly', required: false })
  @IsOptional()
  @IsBoolean()
  showProfile?: boolean;

  @ApiProperty({ example: false, description: 'Share analytics data', required: false })
  @IsOptional()
  @IsBoolean()
  shareData?: boolean;
}

class PreferencesDto {
  @ApiProperty({ example: 'USD', description: 'Preferred currency', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ example: 'en', description: 'Preferred language', required: false })
  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ type: NotificationSettingsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @ApiProperty({ type: PrivacySettingsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PrivacySettingsDto)
  privacy?: PrivacySettingsDto;

  @ApiProperty({ type: PreferencesDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;
}
