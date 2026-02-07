import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export class TrackOrderDto {
  @ApiProperty({
    description: 'Order number to track',
    example: 'RW2511-0000001',
  })
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @ApiProperty({
    description: 'Email address used for the order (provide either email or phone)',
    example: 'customer@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.phone || o.email)
  email?: string;

  @ApiProperty({
    description: 'Phone number used for the order (provide either email or phone)',
    example: '+250788123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.email || o.phone)
  phone?: string;
}
