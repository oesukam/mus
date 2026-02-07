import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordResponseDto {
  @ApiProperty({ example: 'Password reset email sent if account exists', description: 'Success message' })
  message: string;

  @ApiProperty({
    example: 'abc123def456',
    description: 'Password reset token (only in development mode)',
    required: false
  })
  resetToken?: string;
}
