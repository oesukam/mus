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

@Entity('mobile_payments')
export class MobilePayment {
  @ApiProperty({ example: 1, description: 'The unique identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'The user ID' })
  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({
    example: 'MTN Mobile Money',
    description: 'Mobile payment provider name (e.g., MTN Mobile Money, Airtel Money, M-Pesa)',
  })
  @Column({ length: 100 })
  providerName: string;

  @ApiProperty({
    example: '+250788123456',
    description: 'Phone number associated with the mobile payment account',
  })
  @Column({ length: 50 })
  phoneNumber: string;

  @ApiProperty({
    example: 'My Primary Account',
    description: 'Optional label for this payment method',
    required: false,
  })
  @Column({ length: 100, nullable: true })
  label: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is the default payment method',
  })
  @Column({ default: false })
  isDefault: boolean;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  @UpdateDateColumn()
  updatedAt: Date;
}
