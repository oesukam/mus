import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

export class ProductResponseDto {
  @ApiProperty({ type: Product, description: 'The product data' })
  product: Product;
}
