import { IsString, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 1, description: 'The product ID being reviewed' })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 5, description: 'Star rating (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Great product!', description: 'Review title' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'This product exceeded my expectations...', description: 'Review content' })
  @IsString()
  content: string;

  @ApiProperty({ example: true, description: 'Whether you would recommend this product', required: false })
  @IsBoolean()
  @IsOptional()
  wouldRecommend?: boolean;
}
