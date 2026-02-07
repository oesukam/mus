import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Product } from "./product.entity"
import { File } from "../../../common/entities/file.entity"

@Entity("products_images")
export class ProductImage {
  @ApiProperty({ example: 1, description: "The unique identifier" })
  @PrimaryGeneratedColumn()
  id: number

  @ApiProperty({ example: 1, description: "Product ID" })
  @Column()
  productId: number

  @ManyToOne(() => Product, (product) => product.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: Product

  @ApiProperty({ example: 1, description: "File ID" })
  @Column()
  fileId: number

  @ManyToOne(() => File, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "fileId" })
  file: File

  @ApiProperty({ example: 1, description: "Display order of the image" })
  @Column({ default: 0 })
  order: number

  @ApiProperty({ example: false, description: "Whether this is the primary image" })
  @Column({ default: false })
  isPrimary: boolean

  @ApiProperty({ description: "The creation date" })
  @CreateDateColumn()
  createdAt: Date
}
