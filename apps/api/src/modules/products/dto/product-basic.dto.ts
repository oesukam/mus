import { ApiProperty } from "@nestjs/swagger"

export class ProductBasicDto {
  @ApiProperty({ description: "Product ID", example: 1 })
  id: number

  @ApiProperty({ description: "Product name", example: "MacBook Pro 14-inch" })
  name: string

  @ApiProperty({ description: "Product price", example: 1999.99 })
  price: number

  @ApiProperty({ description: "VAT percentage", example: 18 })
  vatPercentage: number

  @ApiProperty({ description: "Currency code", example: "USD" })
  currency: string

  @ApiProperty({ description: "Country code", example: "RW" })
  country: string

  @ApiProperty({ description: "Stock quantity", example: 10 })
  stock: number

  @ApiProperty({ description: "Product category", example: "ELECTRONICS" })
  category: string

  @ApiProperty({ description: "Product type", example: "LAPTOP" })
  type: string

  @ApiProperty({ description: "Whether product is active", example: true })
  isActive: boolean
}

export class ProductSearchBasicResponseDto {
  @ApiProperty({ type: [ProductBasicDto], description: "Array of products" })
  products: ProductBasicDto[]

  @ApiProperty({ description: "Total number of matching products", example: 45 })
  total: number

  @ApiProperty({ description: "Number of results returned", example: 100 })
  limit: number
}
