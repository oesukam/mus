import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../entities/order.entity';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class OrderResponseDto {
  @ApiProperty({ type: Order })
  order: Order;
}

export class OrdersResponseDto {
  @ApiProperty({ type: [Order] })
  orders: Order[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination information' })
  pagination: PaginationMetaDto;
}
