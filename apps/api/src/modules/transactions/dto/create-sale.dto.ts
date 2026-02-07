import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  IsDateString,
  IsPositive,
} from "class-validator"
import { Type } from "class-transformer"
import { ApiProperty } from "@nestjs/swagger"
import { Country } from "../../products/enums/country.enum"
import { Currency } from "../../products/enums/currency.enum"
import { PaymentMethod } from "../../orders/enums/payment-status.enum"

class SaleItemDto {
  @ApiProperty({ example: 1, description: "Product ID (optional)", required: false })
  @IsNumber()
  @IsOptional()
  productId?: number

  @ApiProperty({ example: "Laptop", description: "Product name" })
  @IsString()
  productName: string

  @ApiProperty({ example: 2, description: "Quantity" })
  @IsNumber()
  @Min(1)
  quantity: number

  @ApiProperty({ example: 99.99, description: "Price per item (excluding VAT)" })
  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  @Min(0)
  price: number

  @ApiProperty({ example: 18, description: "VAT percentage (e.g., 18 for 18%)" })
  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  @Min(0)
  vatPercentage: number

  @ApiProperty({ example: 17.998, description: "VAT amount for this item" })
  @Type(() => Number)
  @IsPositive()
  @IsNumber()
  @Min(0)
  vatAmount: number
}

export class CreateSaleDto {
  @ApiProperty({ example: 1, description: "User ID (customer)", required: false })
  @IsNumber()
  @IsOptional()
  userId?: number

  @ApiProperty({
    example: "John Doe",
    description: "Customer name (for walk-in sales)",
    required: false,
  })
  @IsString()
  @IsOptional()
  customerName?: string

  @ApiProperty({ example: "john@example.com", description: "Customer email", required: false })
  @IsString()
  @IsOptional()
  customerEmail?: string

  @ApiProperty({ example: "+1234567890", description: "Customer phone", required: false })
  @IsString()
  @IsOptional()
  customerPhone?: string

  @ApiProperty({
    example: Country.UNITED_STATES,
    description: "Country where the sale was made",
    enum: Country,
  })
  @IsEnum(Country)
  country: Country

  @ApiProperty({
    example: [
      {
        productId: 1,
        productName: "Laptop",
        quantity: 2,
        price: 99.99,
        vatPercentage: 18,
        vatAmount: 17.998,
      },
    ],
    description: "Sale items with VAT details",
    type: [SaleItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => SaleItemDto)
  items: SaleItemDto[]

  @ApiProperty({ example: 199.98, description: "Subtotal amount (excluding VAT)" })
  @IsNumber()
  @Min(0)
  subtotal: number

  @ApiProperty({ example: 35.996, description: "Total VAT amount" })
  @IsNumber()
  @Min(0)
  vatAmount: number

  @ApiProperty({ example: 235.976, description: "Total sale amount (including VAT)" })
  @IsNumber()
  @Min(0)
  amount: number

  @ApiProperty({
    example: Currency.USD,
    description: "Currency of the sale",
    enum: Currency,
    required: false,
    default: Currency.USD,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency

  @ApiProperty({
    example: PaymentMethod.CASH,
    description: "Payment method used",
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod

  @ApiProperty({
    example: "TXN123456789",
    description: "Payment transaction reference",
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentReference?: string

  @ApiProperty({
    example: "2025-01-15",
    description: "Date when the sale occurred (defaults to today)",
    required: false,
  })
  @IsDateString()
  @IsOptional()
  transactionDate?: string

  @ApiProperty({ example: "Walk-in customer purchase", description: "Sale notes", required: false })
  @IsString()
  @IsOptional()
  notes?: string
}
