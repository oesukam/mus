import { ApiProperty } from '@nestjs/swagger';

class NotificationSettings {
  @ApiProperty({ example: true })
  orderUpdates: boolean;

  @ApiProperty({ example: true })
  promotions: boolean;

  @ApiProperty({ example: true })
  wishlistAlerts: boolean;

  @ApiProperty({ example: false })
  newsletter: boolean;
}

class PrivacySettings {
  @ApiProperty({ example: true })
  showProfile: boolean;

  @ApiProperty({ example: false })
  shareData: boolean;
}

class Preferences {
  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'en' })
  language: string;
}

export class SettingsResponseDto {
  @ApiProperty({ type: NotificationSettings })
  notifications: NotificationSettings;

  @ApiProperty({ type: PrivacySettings })
  privacy: PrivacySettings;

  @ApiProperty({ type: Preferences })
  preferences: Preferences;
}

export class SettingsWithMessageResponseDto {
  @ApiProperty({ example: 'Settings updated successfully' })
  message: string;

  @ApiProperty({ type: SettingsResponseDto })
  settings: SettingsResponseDto;
}
