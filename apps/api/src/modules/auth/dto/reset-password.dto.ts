import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123token456', description: 'Password reset token from email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newPassword123', description: 'New password (minimum 6 characters)' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  newPassword: string;
}
