import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import { ProductReviewsService } from "./product-reviews.service"
import { CreateReviewDto } from "./dto/create-review.dto"
import { UpdateReviewDto } from "./dto/update-review.dto"
import { ModerateReviewDto } from "./dto/moderate-review.dto"
import { ProductReview } from "./entities/product-review.entity"
import {
  ReviewResponseDto,
  ReviewsResponseDto,
  ReviewMessageResponseDto,
  ProductRatingResponseDto,
} from "./dto/review-response.dto"
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "../users/enums/user-role.enum"

@ApiTags("products / reviews")
@Controller("products/reviews")
export class ProductReviewsController {
  constructor(private readonly reviewsService: ProductReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a product review" })
  @ApiResponse({ status: 201, description: "Review created successfully", type: ReviewResponseDto })
  @ApiResponse({ status: 400, description: "Bad request - Already reviewed or validation error" })
  @ApiResponse({ status: 404, description: "Product not found" })
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req,
  ): Promise<{ review: ProductReview }> {
    const review = await this.reviewsService.create(createReviewDto, req.user.userId)
    return { review }
  }

  @Get()
  @ApiOperation({ summary: "Get all reviews" })
  @ApiQuery({ name: "productId", required: false, description: "Filter by product ID" })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by status (pending, approved, rejected)",
  })
  @ApiResponse({
    status: 200,
    description: "Reviews retrieved successfully",
    type: ReviewsResponseDto,
  })
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
    @Query("productId") productId?: string,
    @Query("status") status?: string,
  ) {
    return await this.reviewsService.findAll(
      paginationQuery,
      productId ? +productId : undefined,
      status,
    )
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a review by ID" })
  @ApiResponse({
    status: 200,
    description: "Review retrieved successfully",
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: "Review not found" })
  async findOne(@Param("id") id: string): Promise<{ review: ProductReview }> {
    const review = await this.reviewsService.findOne(+id)
    return { review }
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update your own review" })
  @ApiResponse({ status: 200, description: "Review updated successfully", type: ReviewResponseDto })
  @ApiResponse({ status: 403, description: "Forbidden - Not your review" })
  @ApiResponse({ status: 404, description: "Review not found" })
  async update(
    @Param("id") id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ): Promise<{ review: ProductReview }> {
    const review = await this.reviewsService.update(+id, updateReviewDto, req.user.userId)
    return { review }
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete your own review (or any review if admin)" })
  @ApiResponse({
    status: 200,
    description: "Review deleted successfully",
    type: ReviewMessageResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden - Not your review" })
  @ApiResponse({ status: 404, description: "Review not found" })
  async remove(@Param("id") id: string, @Request() req): Promise<{ message: string }> {
    const isAdmin = req.user.role === UserRole.ADMIN
    await this.reviewsService.remove(+id, req.user.userId, isAdmin)
    return { message: "Review deleted successfully" }
  }

  @Patch(":id/moderate")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Moderate a review (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Review moderated successfully",
    type: ReviewResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request - Missing admin note for rejection" })
  @ApiResponse({ status: 404, description: "Review not found" })
  async moderate(
    @Param("id") id: string,
    @Body() moderateReviewDto: ModerateReviewDto,
  ): Promise<{ review: ProductReview }> {
    const review = await this.reviewsService.moderate(+id, moderateReviewDto)
    return { review }
  }

  @Post(":id/helpful")
  @ApiOperation({ summary: "Mark a review as helpful or not helpful" })
  @ApiQuery({
    name: "helpful",
    required: true,
    description: "true for helpful, false for not helpful",
  })
  @ApiResponse({ status: 200, description: "Vote recorded successfully", type: ReviewResponseDto })
  @ApiResponse({ status: 404, description: "Review not found" })
  async markHelpful(
    @Param("id") id: string,
    @Query("helpful") helpful: string,
  ): Promise<{ review: ProductReview }> {
    const review = await this.reviewsService.markHelpful(+id, helpful === "true")
    return { review }
  }

  @Get("product/:productId/rating")
  @ApiOperation({ summary: "Get product rating summary" })
  @ApiResponse({
    status: 200,
    description: "Rating summary retrieved successfully",
    type: ProductRatingResponseDto,
  })
  async getProductRating(@Param("productId") productId: string): Promise<{
    averageRating: number
    totalReviews: number
    ratingDistribution: { [key: number]: number }
  }> {
    return this.reviewsService.getProductRating(+productId)
  }
}
