import { ApiProperty } from '@nestjs/swagger';

class ProductInfo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: string;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  stockStatus: string;

  @ApiProperty()
  discountPercentage: string;

  @ApiProperty({ required: false })
  summary?: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ required: false })
  type?: string;

  @ApiProperty({ required: false })
  coverImage?: {
    url: string;
    urlThumbnail?: string;
    urlMedium?: string;
    urlLarge?: string;
  };
}

class CartItemResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  product: ProductInfo;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CartResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty({ type: [CartItemResponse] })
  items: CartItemResponse[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
