import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateMobilePaymentDto {
  @ApiProperty({
    example: 'MTN Mobile Money',
    description: 'Mobile payment provider name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  providerName: string;

  @ApiProperty({
    example: '+250788123456',
    description: 'Phone number for mobile payment',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phoneNumber: string;

  @ApiProperty({
    example: 'My Primary Account',
    description: 'Optional label for this payment method',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  label?: string;

  @ApiProperty({
    example: false,
    description: 'Set as default payment method',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
