import { IsNumberString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductIdDto {
  @ApiProperty({ example: '1', description: 'The unique identifier of the product' })
  @IsNumberString()
  @IsNotEmpty()
  id: string;
}
