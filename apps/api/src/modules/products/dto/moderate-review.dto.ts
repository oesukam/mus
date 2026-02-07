import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class ModerateReviewDto {
  @ApiProperty({ example: ReviewStatus.APPROVED, description: 'Review status', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiProperty({ example: 'Inappropriate content', description: 'Admin note (required for rejection)', required: false })
  @IsString()
  @IsOptional()
  adminNote?: string;
}
