import { ApiProperty } from '@nestjs/swagger';
import { ShippingAddress } from '../entities/shipping-address.entity';

export class ShippingAddressResponseDto {
  @ApiProperty({ type: ShippingAddress })
  address: ShippingAddress;

  @ApiProperty({ example: 'Shipping address created successfully' })
  message?: string;
}

export class ShippingAddressesListResponseDto {
  @ApiProperty({ type: [ShippingAddress] })
  addresses: ShippingAddress[];
}

export class ShippingAddressDeleteResponseDto {
  @ApiProperty({ example: 'Shipping address deleted successfully' })
  message: string;
}
