import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReview } from './entities/product-review.entity';
import { Product } from './entities/product.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ModerateReviewDto, ReviewStatus } from './dto/moderate-review.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

@Injectable()
export class ProductReviewsService {
  constructor(
    @InjectRepository(ProductReview)
    private reviewsRepository: Repository<ProductReview>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: number): Promise<ProductReview> {
    // Check if product exists
    const product = await this.productsRepository.findOne({
      where: { id: createReviewDto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${createReviewDto.productId} not found`);
    }

    // Check if user already reviewed this product
    const existingReview = await this.reviewsRepository.findOne({
      where: {
        productId: createReviewDto.productId,
        userId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = this.reviewsRepository.create({
      ...createReviewDto,
      userId,
      status: 'pending', // Reviews need moderation by default
    });

    return this.reviewsRepository.save(review);
  }

  async findAll(paginationQuery: PaginationQueryDto, productId?: number, status?: string): Promise<{ reviews: ProductReview[]; pagination: PaginationMetaDto }> {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reviewsRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product')
      .orderBy('review.createdAt', 'DESC');

    if (productId) {
      queryBuilder.andWhere('review.productId = :productId', { productId });
    }

    if (status) {
      queryBuilder.andWhere('review.status = :status', { status });
    }

    const total = await queryBuilder.getCount();
    const reviews = await queryBuilder
      .skip(skip)
      .take(limit)
      .getMany();

    const pagination = new PaginationMetaDto(total, page, limit);
    return { reviews, pagination };
  }

  async findOne(id: number): Promise<ProductReview> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(id: number, updateReviewDto: UpdateReviewDto, userId: number): Promise<ProductReview> {
    const review = await this.findOne(id);

    // Only the review author can update their review
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Reset status to pending if content is modified
    if (updateReviewDto.content || updateReviewDto.title || updateReviewDto.rating) {
      review.status = 'pending';
    }

    Object.assign(review, updateReviewDto);
    return this.reviewsRepository.save(review);
  }

  async remove(id: number, userId: number, isAdmin: boolean = false): Promise<void> {
    const review = await this.findOne(id);

    // Only the review author or admin can delete
    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewsRepository.remove(review);
  }

  async moderate(id: number, moderateReviewDto: ModerateReviewDto): Promise<ProductReview> {
    const review = await this.findOne(id);

    if (moderateReviewDto.status === ReviewStatus.REJECTED && !moderateReviewDto.adminNote) {
      throw new BadRequestException('Admin note is required when rejecting a review');
    }

    review.status = moderateReviewDto.status;
    review.adminNote = moderateReviewDto.adminNote || null;

    return this.reviewsRepository.save(review);
  }

  async markHelpful(id: number, helpful: boolean): Promise<ProductReview> {
    const review = await this.findOne(id);

    if (helpful) {
      review.helpfulCount += 1;
    } else {
      review.notHelpfulCount += 1;
    }

    return this.reviewsRepository.save(review);
  }

  async getProductRating(productId: number): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const reviews = await this.reviewsRepository.find({
      where: {
        productId,
        status: 'approved',
      },
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sumRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = Math.round((sumRatings / totalReviews) * 10) / 10;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    return {
      averageRating,
      totalReviews,
      ratingDistribution,
    };
  }
}
