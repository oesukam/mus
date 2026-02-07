import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory, ProductType } from '../enums/product-category.enum';

export class TaxonomyResponseDto {
  @ApiProperty({
    description: 'Product taxonomy mapping categories to their types',
    example: {
      [ProductCategory.ELECTRONICS]: [ProductType.LAPTOP, ProductType.SMARTPHONE, ProductType.TABLET],
      [ProductCategory.CLOTHING]: [ProductType.SHIRT, ProductType.PANTS, ProductType.DRESS],
    },
  })
  taxonomy: Record<ProductCategory, ProductType[]>;
}
