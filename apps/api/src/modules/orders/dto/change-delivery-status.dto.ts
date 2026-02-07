import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../enums/delivery-status.enum';

export class ChangeDeliveryStatusDto {
  @ApiProperty({
    example: DeliveryStatus.SHIPPED,
    description: 'New delivery status',
    enum: DeliveryStatus,
  })
  @IsEnum(DeliveryStatus)
  deliveryStatus: DeliveryStatus;

  @ApiProperty({
    example: 'TRK123456789',
    description: 'Tracking number (optional, typically provided when status is SHIPPED)',
    required: false,
  })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiProperty({
    example: 'DHL',
    description: 'Shipping carrier (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiProperty({
    example: '2024-01-15T10:00:00Z',
    description: 'Estimated delivery date (optional)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  estimatedDeliveryDate?: string;

  @ApiProperty({
    example: 'Package is on the way',
    description: 'Notes about the status change (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
