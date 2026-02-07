import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class ProductsResponseDto {
  @ApiProperty({ type: [Product], description: 'Array of products' })
  products: Product[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination information' })
  pagination: PaginationMetaDto;
}
