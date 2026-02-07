import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Cart } from './cart.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('cart_items')
export class CartItem {
  @ApiProperty({ example: 1, description: 'Cart item ID' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 1, description: 'Cart ID' })
  @Column({ name: 'cart_id' })
  cartId: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ApiProperty({ example: 1, description: 'Product ID' })
  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: 2, description: 'Quantity' })
  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Created at timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Updated at timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
