import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductSlugDto {
  @ApiProperty({ example: 'high-performance-laptop', description: 'The unique slug of the product' })
  @IsString()
  @IsNotEmpty()
  slug: string;
}
