import { PaginationQueryDto } from "@/common/dto/pagination-query.dto"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { IsEnum, IsOptional } from "class-validator"
import { ProductCategory, ProductType } from "../enums/product-category.enum"

export class ProductsPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: ProductCategory.ELECTRONICS,
    description: "Category to filter products",
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory

  @ApiPropertyOptional({
    example: ProductType.LAPTOP,
    description: "Type to filter products",
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType
}
