import { IsString, IsOptional, IsNumber, Min, IsBoolean, IsEnum } from "class-validator"
import { Type, Transform } from "class-transformer"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { ProductCategory, ProductType } from "../enums/product-category.enum"
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto"

export enum SortBy {
  PRICE_LOW = "price-low",
  PRICE_HIGH = "price-high",
  NAME_ASC = "name-asc",
  NAME_DESC = "name-desc",
  NEWEST = "newest",
  OLDEST = "oldest",
}

/**
 * Unified DTO for querying products
 * Combines basic pagination with advanced search/filter capabilities
 */
export class ProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: "Search query to match against product name, description, category, and type",
    example: "laptop",
  })
  @IsOptional()
  @IsString()
  query?: string

  @ApiPropertyOptional({
    description: "Categories to filter by (multiple values)",
    example: [ProductCategory.ACCESSORIES, ProductCategory.ELECTRONICS],
    enum: ProductCategory,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") return [value]
    return Array.isArray(value) ? value : [value]
  })
  @IsEnum(ProductCategory, { each: true })
  categories?: ProductCategory[]

  // Type filters (supports both single and multiple)
  @ApiPropertyOptional({
    description: "Product type to filter (single value)",
    example: ProductType.LAPTOP,
    enum: ProductType,
  })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType

  @ApiPropertyOptional({
    description: "Product types to filter by (multiple values)",
    example: [ProductType.WATCH, ProductType.LAPTOP],
    enum: ProductType,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") return [value]
    return Array.isArray(value) ? value : [value]
  })
  @IsEnum(ProductType, { each: true })
  types?: ProductType[]

  // Feature filters
  @ApiPropertyOptional({
    description: "Filter for featured products only",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  featured?: boolean

  @ApiPropertyOptional({
    description: "Filter for new arrivals (products created in last 30 days)",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  newArrival?: boolean

  @ApiPropertyOptional({
    description: "Filter for out of stock products only (stock = 0)",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  outOfStock?: boolean

  @ApiPropertyOptional({
    description: "Filter for active products only",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isActive?: boolean

  // Price filters
  @ApiPropertyOptional({
    description: "Minimum price filter",
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number

  @ApiPropertyOptional({
    description: "Maximum price filter",
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number

  // Sorting
  @ApiPropertyOptional({
    description: "Sort order",
    example: SortBy.PRICE_LOW,
    enum: SortBy,
    default: SortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.NEWEST
}
