import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProductCategory, ProductType } from '../enums/product-category.enum';
import { Currency } from '../enums/currency.enum';
import { Country } from '../enums/country.enum';
import { IsCategoryTypeValid } from '../validators/category-type.validator';

export class UpdateProductDto {
  @ApiProperty({ example: 'Laptop', description: 'The name of the product', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'high-performance-laptop',
    description: 'The unique slug of the product',
    required: false,
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'High-performance laptop', description: 'The description of the product', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 999.99, description: 'The price of the product (excluding VAT)', required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({
    example: 18,
    description: 'VAT percentage (e.g., 18 for 18%)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  vatPercentage?: number;

  @ApiProperty({
    example: 0,
    description: 'Shipping rate per kilometer (default 0)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingRatePerKm?: number;

  @ApiProperty({
    example: 1.5,
    description: 'Product weight in kilograms (default 0)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  weightInKg?: number;

  @ApiProperty({
    example: Currency.USD,
    description: 'The currency of the product price',
    enum: Currency,
    required: false,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiProperty({
    example: Country.UNITED_STATES,
    description: 'Country where this product is available',
    enum: Country,
    required: false,
  })
  @IsEnum(Country)
  @IsOptional()
  country?: Country;

  @ApiProperty({ example: 50, description: 'The stock quantity', required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @ApiProperty({
    example: ProductCategory.ELECTRONICS,
    description: 'The category of the product',
    enum: ProductCategory,
    required: false,
  })
  @IsEnum(ProductCategory)
  @IsOptional()
  category?: ProductCategory;

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

  @ApiProperty({
    example: 1,
    description: 'Cover image file ID (reference to files table)',
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  coverImageId?: number;

  @ApiProperty({ example: true, description: 'Whether the product is active', required: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: false, description: 'Whether the product is featured', required: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}
