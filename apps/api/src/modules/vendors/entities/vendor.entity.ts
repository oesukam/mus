import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('vendors')
export class Vendor {
  @ApiProperty({ example: 1, description: 'Unique identifier for the vendor' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Acme Supplies Inc.', description: 'Vendor company name' })
  @Column()
  name: string;

  @ApiProperty({
    example: 'supplies@acme.com',
    description: 'Vendor contact email',
    required: false,
  })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({
    example: '+1-555-0123',
    description: 'Vendor contact phone',
    required: false,
  })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({
    example: '123 Business St, City, State 12345',
    description: 'Vendor physical address',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiProperty({
    example: 'UNITED_STATES',
    description: 'Vendor country code',
    required: false,
  })
  @Column({ nullable: true })
  country: string;

  @ApiProperty({
    example: 'Office supplies and equipment',
    description: 'Description of products/services provided',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    example: 'John Smith',
    description: 'Primary contact person name',
    required: false,
  })
  @Column({ nullable: true })
  contactPerson: string;

  @ApiProperty({
    example: 'TAX123456',
    description: 'Tax ID or VAT number',
    required: false,
  })
  @Column({ nullable: true })
  taxId: string;

  @ApiProperty({
    example: 'https://acme-supplies.com',
    description: 'Vendor website URL',
    required: false,
  })
  @Column({ nullable: true })
  website: string;

  @ApiProperty({
    example: 'Payment terms and special notes',
    description: 'Additional notes about the vendor',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ example: true, description: 'Whether the vendor is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Date when vendor was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date when vendor was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;
}
