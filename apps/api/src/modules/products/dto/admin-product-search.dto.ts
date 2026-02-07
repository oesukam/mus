import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from "class-validator"
import { Type, Transform } from "class-transformer"
import { ApiPropertyOptional } from "@nestjs/swagger"

export class AdminProductSearchDto {
  @ApiPropertyOptional({
    description: "Search query to match against product name, SKU, or description",
    example: "laptop",
  })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({
    description: "Maximum number of results to return",
    example: 100,
    default: 100,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100

  @ApiPropertyOptional({
    description: "Filter for active products only",
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isActive?: boolean = true
}
