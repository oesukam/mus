import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../enums/product-category.enum';

export class CategoriesResponseDto {
  @ApiProperty({
    enum: ProductCategory,
    isArray: true,
    description: 'Array of product categories',
    example: Object.values(ProductCategory)
  })
  categories: ProductCategory[];
}
