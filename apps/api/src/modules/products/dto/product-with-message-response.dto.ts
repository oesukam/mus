import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

export class ProductWithMessageResponseDto {
  @ApiProperty({ type: Product, description: 'The product data' })
  product: Product;

  @ApiProperty({ example: 'Operation completed successfully', description: 'Success message' })
  message: string;
}
