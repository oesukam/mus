import { IsOptional, IsBoolean, IsString, IsIn } from "class-validator"
import { Transform } from "class-transformer"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { ProductsQueryDto } from "./products-query.dto"

export class AdminProductsQueryDto extends ProductsQueryDto {
  @ApiPropertyOptional({
    description: "Filter for active products only",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({
    description: "Field to sort by",
    enum: ["name", "price", "stock", "category", "type", "country", "createdAt", "updatedAt", "isActive"],
    default: "createdAt",
  })
  @IsOptional()
  @IsString()
  @IsIn(["name", "price", "stock", "category", "type", "country", "createdAt", "updatedAt", "isActive"])
  sortByField?: string

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["asc", "desc"],
    default: "desc",
  })
  @IsOptional()
  @IsString()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc"
}
