import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({ example: 'Password reset successfully', description: 'Success message' })
  message: string;
}
