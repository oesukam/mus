import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Product } from "./product.entity"
import { User } from "../../users/entities/user.entity"

@Entity("products_reviews")
export class ProductReview {
  @ApiProperty({ example: 1, description: "The unique identifier of the review" })
  @PrimaryGeneratedColumn()
  id: number

  @ApiProperty({ example: 1, description: "The product ID being reviewed" })
  @Column()
  productId: number

  @ApiProperty({ description: "The product being reviewed", type: () => Product })
  @ManyToOne(() => Product, (product) => product.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product

  @ApiProperty({ example: 1, description: "The user ID who wrote the review" })
  @Column()
  userId: number

  @ApiProperty({ description: "The user who wrote the review", type: () => User })
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User

  @ApiProperty({ example: 5, description: "Star rating (1-5)", minimum: 1, maximum: 5 })
  @Column({ type: "int" })
  rating: number

  @ApiProperty({ example: "Great product!", description: "Review title" })
  @Column()
  title: string

  @ApiProperty({
    example: "This product exceeded my expectations...",
    description: "Review content",
  })
  @Column("text")
  content: string

  @ApiProperty({ example: true, description: "Whether the user would recommend this product" })
  @Column({ default: true })
  wouldRecommend: boolean

  @ApiProperty({
    example: true,
    description: "Whether the review has been verified (user purchased the product)",
  })
  @Column({ default: false })
  isVerifiedPurchase: boolean

  @ApiProperty({ example: 5, description: "Number of helpful votes" })
  @Column({ default: 0 })
  helpfulCount: number

  @ApiProperty({ example: 1, description: "Number of not helpful votes" })
  @Column({ default: 0 })
  notHelpfulCount: number

  @ApiProperty({ example: "pending", description: "Review moderation status" })
  @Column({ default: "pending" })
  status: string // pending, approved, rejected

  @ApiProperty({
    example: "Inappropriate content",
    description: "Admin note for rejection",
    required: false,
  })
  @Column({ nullable: true })
  adminNote: string

  @ApiProperty({ description: "The creation date of the review" })
  @CreateDateColumn()
  createdAt: Date

  @ApiProperty({ description: "The last update date of the review" })
  @UpdateDateColumn()
  updatedAt: Date
}
