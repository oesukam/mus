import { IsNotEmpty, IsNumber, IsArray, IsEnum, ValidateNested, ArrayMinSize, Min, IsEmail, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Country } from '../../products/enums/country.enum';

class OrderItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 99.99, description: 'Price per item (excluding VAT)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 18, description: 'VAT percentage (e.g., 18 for 18%)' })
  @IsNumber()
  @Min(0)
  vatPercentage: number;

  @ApiProperty({ example: 17.998, description: 'VAT amount for this item' })
  @IsNumber()
  @Min(0)
  vatAmount: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: Country.UNITED_STATES,
    description: 'Country where the order is placed',
    enum: Country,
  })
  @IsEnum(Country)
  country: Country;

  @ApiProperty({
    example: [{ productId: 1, quantity: 2, price: 99.99, vatPercentage: 18, vatAmount: 17.998 }],
    description: 'Order items with VAT details',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 199.98, description: 'Subtotal amount (excluding VAT)' })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ example: 35.996, description: 'Total VAT amount' })
  @IsNumber()
  @Min(0)
  vatAmount: number;

  @ApiProperty({ example: 235.976, description: 'Total amount of the order (including VAT)' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiProperty({ example: 'John Doe', description: 'Recipient full name', required: false })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiProperty({ example: 'john@example.com', description: 'Recipient email address' })
  @IsEmail()
  recipientEmail: string;

  @ApiProperty({ example: '+1234567890', description: 'Recipient phone number', required: false })
  @IsString()
  @IsOptional()
  recipientPhone?: string;

  @ApiProperty({ example: '123 Main St, Apt 4B', description: 'Shipping address' })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiProperty({ example: 'New York', description: 'Shipping city' })
  @IsString()
  @IsNotEmpty()
  shippingCity: string;

  @ApiProperty({ example: 'NY', description: 'Shipping state/province', required: false })
  @IsString()
  @IsOptional()
  shippingState?: string;

  @ApiProperty({ example: '10001', description: 'Shipping ZIP/postal code', required: false })
  @IsString()
  @IsOptional()
  shippingZipCode?: string;

  @ApiProperty({ example: 'United States', description: 'Shipping country name' })
  @IsString()
  @IsNotEmpty()
  shippingCountry: string;
}
