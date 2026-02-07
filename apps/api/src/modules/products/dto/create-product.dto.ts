import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory, ProductType } from '../enums/product-category.enum';
import { Currency } from '../enums/currency.enum';
import { Country } from '../enums/country.enum';
import { IsCategoryTypeValid } from '../validators/category-type.validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop', description: 'The name of the product' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'high-performance-laptop', description: 'The unique slug of the product (auto-generated from name if not provided)', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'High-performance laptop', description: 'The description of the product' })
  @IsString()
  description: string;

  @ApiProperty({ example: 999.99, description: 'The price of the product (excluding VAT)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    example: 18,
    description: 'VAT percentage (e.g., 18 for 18%)',
    required: false,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  vatPercentage?: number;

  @ApiProperty({
    example: 0,
    description: 'Shipping rate per kilometer (default 0)',
    required: false,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingRatePerKm?: number;

  @ApiProperty({
    example: 1.5,
    description: 'Product weight in kilograms (default 0)',
    required: false,
    default: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightInKg?: number;

  @ApiProperty({
    example: Currency.USD,
    description: 'The currency of the product price',
    enum: Currency,
    required: false,
    default: Currency.USD,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiProperty({
    example: Country.UNITED_STATES,
    description: 'Country where this product is available (required for managing country-specific stock)',
    enum: Country,
  })
  @IsEnum(Country)
  country: Country;

  @ApiProperty({ example: 50, description: 'The stock quantity' })
  @IsNumber()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({
    example: ProductCategory.ELECTRONICS,
    description: 'The category of the product',
    enum: ProductCategory,
  })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({
    example: ProductType.LAPTOP,
    description: 'The type of the product (must match the category)',
    enum: ProductType,
    required: false,
  })
  @IsEnum(ProductType)
  @IsOptional()
  @IsCategoryTypeValid({ message: 'Type must be valid for the selected category' })
  type?: ProductType;

  @ApiProperty({ example: 1, description: 'Cover image file ID (reference to files table)', required: false })
  @IsNumber()
  @IsOptional()
  coverImageId?: number;

  @ApiProperty({ example: true, description: 'Whether the product is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
