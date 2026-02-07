import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { ProductReview } from "./product-review.entity"
import { ProductImage } from "./product-image.entity"
import { File } from "../../../common/entities/file.entity"
import { ProductStockStatus } from "../enums/product-status.enum"
import { ProductCategory, ProductType } from "../enums/product-category.enum"
import { Currency } from "../enums/currency.enum"
import { Country } from "../enums/country.enum"

@Entity("products")
export class Product {
  @ApiProperty({ example: 1, description: "The unique identifier of the product" })
  @PrimaryGeneratedColumn()
  id: number

  @ApiProperty({ example: "Laptop", description: "The name of the product" })
  @Column()
  name: string

  @ApiProperty({
    example: "high-performance-laptop",
    description: "The unique slug of the product",
  })
  @Column({ unique: true })
  @Index()
  slug: string

  @ApiProperty({
    example: "Powerful laptop for professionals and gamers",
    description: "Brief summary of the product (for cards and listings)",
    required: false,
  })
  @Column({ type: "varchar", length: 255, nullable: true })
  summary: string

  @ApiProperty({
    example: "High-performance laptop with cutting-edge processor and graphics...",
    description: "Full description of the product",
  })
  @Column("text")
  description: string

  @ApiProperty({ example: 999.99, description: "The price of the product (excluding VAT)" })
  @Column("decimal", { precision: 10, scale: 2 })
  price: number

  @ApiProperty({ example: 18, description: "VAT percentage (e.g., 18 for 18%)", required: false })
  @Column("decimal", { precision: 5, scale: 2, default: 0 })
  vatPercentage: number

  @ApiProperty({ example: 0, description: "Shipping rate per kilometer (default 0)", required: false })
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  shippingRatePerKm: number

  @ApiProperty({ example: 1.5, description: "Product weight in kilograms (default 0)", required: false })
  @Column("decimal", { precision: 10, scale: 3, default: 0 })
  weightInKg: number

  @ApiProperty({
    example: Currency.USD,
    description: "The currency of the product price",
    enum: Currency,
  })
  @Column({
    type: "enum",
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency

  @ApiProperty({
    example: Country.UNITED_STATES,
    description: "Country where this product is available (for managing country-specific stock)",
    enum: Country,
  })
  @Column({
    type: "enum",
    enum: Country,
  })
  country: Country

  @ApiProperty({ example: 50, description: "The stock quantity" })
  @Column({ default: 0 })
  stockQuantity: number

  @ApiProperty({
    example: ProductCategory.ACCESSORIES,
    description: "The category of the product",
    enum: ProductCategory,
  })
  @Column({
    type: "enum",
    enum: ProductCategory,
  })
  category: ProductCategory

  @ApiProperty({
    example: ProductType.WATCH,
    description: "The type of the product (must match category)",
    enum: ProductType,
  })
  @Column({
    type: "enum",
    enum: ProductType,
    nullable: true,
  })
  type: ProductType

  // Cover Image Relationship
  @ApiProperty({ example: 1, description: "Cover image file ID", required: false })
  @Column({ nullable: true })
  coverImageId: number

  @ApiProperty({ description: "Cover image file", type: () => File, required: false })
  @ManyToOne(() => File, { nullable: true })
  @JoinColumn({ name: "coverImageId" })
  coverImage: File

  // Product Images Relationship
  @ApiProperty({ description: "Product images", type: () => [ProductImage] })
  @OneToMany(() => ProductImage, (productImage) => productImage.product)
  images: ProductImage[]

  @ApiProperty({ description: "Product reviews", type: () => [ProductReview] })
  @OneToMany(() => ProductReview, (review) => review.product)
  reviews: ProductReview[]

  @ApiProperty({ example: true, description: "Whether the product is active" })
  @Column({ default: true })
  isActive: boolean

  @ApiProperty({ example: false, description: "Whether the product is featured" })
  @Column({ default: false })
  isFeatured: boolean

  @ApiProperty({
    example: ProductStockStatus.IN_STOCK,
    description: "The stock status of the product",
    enum: ProductStockStatus,
  })
  @Column({
    type: "enum",
    enum: ProductStockStatus,
    default: ProductStockStatus.IN_STOCK,
  })
  stockStatus: ProductStockStatus

  @ApiProperty({ example: 10, description: "Discount percentage (0-100)" })
  @Column("decimal", { precision: 5, scale: 2, default: 0 })
  discountPercentage: number

  @ApiProperty({ example: 899.99, description: "Discounted price (calculated)" })
  discountedPrice?: number

  // Full-text search vector (generated column)
  @Index("IDX_PRODUCT_SEARCH", { synchronize: false })
  @Column({
    type: "tsvector",
    generatedType: "STORED",
    asExpression: `to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '') || ' ' || coalesce(type, ''))`,
    select: false,
  })
  searchVector: string

  @ApiProperty({ description: "The creation date of the product" })
  @CreateDateColumn()
  createdAt: Date

  @ApiProperty({ description: "The last update date of the product" })
  @UpdateDateColumn()
  updatedAt: Date
}
