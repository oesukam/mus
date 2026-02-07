import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateShippingAddressDto {
  @ApiProperty({ example: 'John Doe', description: 'Recipient name' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '+1234567890', description: 'Recipient phone number', required: false })
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiProperty({ example: '123 Main St, Apt 4B', description: 'Street address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'NY', description: 'State/Province', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '10001', description: 'ZIP/Postal code', required: false })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({ example: 'United States', description: 'Country name' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: true, description: 'Set as default shipping address', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
