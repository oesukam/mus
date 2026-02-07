import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateShippingAddressDto {
  @ApiProperty({ example: 'John Doe', description: 'Recipient name', required: false })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiProperty({ example: '+1234567890', description: 'Recipient phone number', required: false })
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiProperty({ example: '123 Main St, Apt 4B', description: 'Street address', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'New York', description: 'City', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'NY', description: 'State/Province', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '10001', description: 'ZIP/Postal code', required: false })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({ example: 'United States', description: 'Country name', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: true, description: 'Set as default shipping address', required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
