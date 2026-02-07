import { IsOptional, IsEnum, IsString, IsDateString, IsIn } from "class-validator"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { PaginationQueryDto } from "../../../common/dto/pagination-query.dto"
import { TransactionType } from "../entities/transaction.entity"
import { Country } from "../../products/enums/country.enum"

export class TransactionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: TransactionType,
    description: "Filter by transaction type",
    example: TransactionType.SALE,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType

  @ApiPropertyOptional({
    enum: Country,
    description: "Filter by country",
    example: Country.RWANDA,
  })
  @IsOptional()
  @IsEnum(Country)
  country?: Country

  @ApiPropertyOptional({
    description: "Filter by start date (YYYY-MM-DD)",
    example: "2024-01-01",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({
    description: "Filter by end date (YYYY-MM-DD)",
    example: "2024-12-31",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string

  @ApiPropertyOptional({
    description: "Field to sort by",
    example: "transactionDate",
    default: "transactionDate",
  })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["asc", "desc"],
    example: "desc",
    default: "desc",
  })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc"
}
