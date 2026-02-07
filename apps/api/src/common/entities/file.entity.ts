import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('files')
export class File {
  @ApiProperty({ example: 1, description: 'The unique identifier of the file' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    example: 'products/uuid.jpg',
    description: 'The unique key/path of the file in storage',
  })
  @Column({ unique: true })
  key: string;

  @ApiProperty({
    example: 'https://minio:9000/products/uuid.jpg',
    description: 'The full URL to access the file',
  })
  @Column()
  url: string;

  @ApiProperty({
    example: 'https://minio:9000/products/uuid-thumb.jpg',
    description: 'The full URL to access the thumbnail version (300px width)',
    required: false,
  })
  @Column({ nullable: true })
  urlThumbnail: string;

  @ApiProperty({
    example: 'https://minio:9000/products/uuid-medium.jpg',
    description: 'The full URL to access the medium version (800px width)',
    required: false,
  })
  @Column({ nullable: true })
  urlMedium: string;

  @ApiProperty({
    example: 'https://minio:9000/products/uuid-large.jpg',
    description: 'The full URL to access the large version (1200px width)',
    required: false,
  })
  @Column({ nullable: true })
  urlLarge: string;

  @ApiProperty({ example: 'product-image.jpg', description: 'Original filename' })
  @Column()
  originalName: string;

  @ApiProperty({
    example: 'Product Cover Image',
    description: 'Human-readable title for the file',
    required: false,
  })
  @Column({ nullable: true })
  title: string;

  @ApiProperty({
    example: 'Main product image showing the front view',
    description: 'Description of the file content or purpose',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type of the file' })
  @Column()
  mimeType: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  @Column()
  size: number;

  @ApiProperty({ example: 'products', description: 'Folder/category of the file' })
  @Column()
  folder: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the user who uploaded the file',
    required: false,
  })
  @Column({ nullable: true })
  uploadedBy: number;

  @ApiProperty({
    example: 'product',
    description: 'Type of entity this file is associated with',
    required: false,
  })
  @Column({ nullable: true })
  entityType: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the entity this file is associated with',
    required: false,
  })
  @Column({ nullable: true })
  entityId: number;

  @ApiProperty({ description: 'The creation date of the file record' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'The last update date of the file record' })
  @UpdateDateColumn()
  updatedAt: Date;
}
