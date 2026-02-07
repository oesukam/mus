import { ApiProperty } from '@nestjs/swagger';
import { ProductReview } from '../entities/product-review.entity';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class ReviewResponseDto {
  @ApiProperty({ type: ProductReview })
  review: ProductReview;
}

export class ReviewsResponseDto {
  @ApiProperty({ type: [ProductReview] })
  reviews: ProductReview[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination information' })
  pagination: PaginationMetaDto;
}

export class ReviewMessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}

export class ProductRatingResponseDto {
  @ApiProperty({ example: 4.5, description: 'Average rating' })
  averageRating: number;

  @ApiProperty({ example: 100, description: 'Total number of reviews' })
  totalReviews: number;

  @ApiProperty({
    example: { 1: 5, 2: 10, 3: 15, 4: 30, 5: 40 },
    description: 'Rating distribution by stars'
  })
  ratingDistribution: { [key: number]: number };
}
