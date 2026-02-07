import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('shipping_addresses')
export class ShippingAddress {
  @ApiProperty({ example: 1, description: 'The unique identifier of the shipping address' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'The ID of the user who owns this address' })
  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: 'John Doe', description: 'Recipient name' })
  @Column()
  recipientName: string;

  @ApiProperty({ example: '+1234567890', description: 'Recipient phone number', required: false })
  @Column({ nullable: true })
  recipientPhone: string;

  @ApiProperty({ example: '123 Main St, Apt 4B', description: 'Street address' })
  @Column({ type: 'text' })
  address: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  @Column()
  city: string;

  @ApiProperty({ example: 'NY', description: 'State/Province', required: false })
  @Column({ nullable: true })
  state: string;

  @ApiProperty({ example: '10001', description: 'ZIP/Postal code', required: false })
  @Column({ nullable: true })
  zipCode: string;

  @ApiProperty({ example: 'United States', description: 'Country name' })
  @Column()
  country: string;

  @ApiProperty({ example: true, description: 'Whether this is the default shipping address' })
  @Column({ default: false })
  isDefault: boolean;

  @ApiProperty({ description: 'The creation date of the address' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'The last update date of the address' })
  @UpdateDateColumn()
  updatedAt: Date;
}
