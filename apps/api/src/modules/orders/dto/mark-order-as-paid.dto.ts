import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../enums/payment-status.enum';

export class MarkOrderAsPaidDto {
  @ApiProperty({
    example: PaymentMethod.CREDIT_CARD,
    description: 'Payment method used',
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    example: 'TXN123456789',
    description: 'Payment transaction reference',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;

  @ApiProperty({
    example: 'Payment received and verified',
    description: 'Payment notes',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentNotes?: string;
}
