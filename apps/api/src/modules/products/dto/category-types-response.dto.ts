import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory, ProductType } from '../enums/product-category.enum';

export class CategoryTypesResponseDto {
  @ApiProperty({
    enum: ProductCategory,
    description: 'The product category',
    example: ProductCategory.ELECTRONICS
  })
  category: ProductCategory;

  @ApiProperty({
    enum: ProductType,
    isArray: true,
    description: 'Array of valid product types for the category'
  })
  types: ProductType[];
}
