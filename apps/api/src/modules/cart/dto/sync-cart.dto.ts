import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsInt, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CartItemInput {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class SyncCartDto {
  @ApiProperty({
    description: 'Array of cart items to sync',
    type: [CartItemInput],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemInput)
  items: CartItemInput[];
}
