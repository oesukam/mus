import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';
import { PaginationDto } from './pagination-response.dto';

export class ProductSearchResponseDto {
  @ApiProperty({ type: [Product], description: 'Array of products matching the search' })
  products: Product[];

  @ApiProperty({ type: PaginationDto, description: 'Pagination information' })
  pagination: PaginationDto;
}
