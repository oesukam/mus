import { IsString, IsOptional, IsNumber, Min, IsBoolean, IsEnum } from "class-validator"
import { Type, Transform } from "class-transformer"
import { ApiProperty } from "@nestjs/swagger"
import { ProductCategory, ProductType } from "../enums/product-category.enum"

export enum SortBy {
  PRICE_LOW = "price-low",
  PRICE_HIGH = "price-high",
  NAME_ASC = "name-asc",
  NAME_DESC = "name-desc",
  NEWEST = "newest",
  OLDEST = "oldest",
}

export class SearchProductDto {
  @ApiProperty({
    description: "Search query to match against product name, description, category, and type",
    example: "laptop",
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string

  @ApiProperty({
    description: "Page number for pagination",
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @ApiProperty({
    description: "Number of results per page",
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10

  @ApiProperty({
    description: "Categories to filter by (can pass multiple)",
    example: [ProductCategory.ACCESSORIES, ProductCategory.ELECTRONICS],
    enum: ProductCategory,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle both single value and array
    if (typeof value === "string") return [value]
    return Array.isArray(value) ? value : [value]
  })
  @IsEnum(ProductCategory, { each: true })
  categories?: ProductCategory[]

  @ApiProperty({
    description: "Product types to filter by (can pass multiple)",
    example: [ProductType.WATCH, ProductType.LAPTOP],
    enum: ProductType,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Handle both single value and array
    if (typeof value === "string") return [value]
    return Array.isArray(value) ? value : [value]
  })
  @IsEnum(ProductType, { each: true })
  types?: ProductType[]

  @ApiProperty({
    description: "Filter for featured products only",
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  featured?: boolean

  @ApiProperty({
    description: "Filter for new arrivals (products created in last 30 days)",
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  newArrival?: boolean

  @ApiProperty({
    description: "Filter for out of stock products only (stock = 0)",
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  outOfStock?: boolean

  @ApiProperty({
    description: "Sort order",
    example: SortBy.PRICE_LOW,
    enum: SortBy,
    required: false,
    default: SortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.NEWEST

  @ApiProperty({
    description: "Minimum price filter",
    example: 0,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number

  @ApiProperty({
    description: "Maximum price filter",
    example: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number

  @ApiProperty({
    description: "Filter for active products only",
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isActive?: boolean
}
