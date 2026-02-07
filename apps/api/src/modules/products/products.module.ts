import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductsAdminController } from './products-admin.controller';
import { ProductReviewsService } from './product-reviews.service';
import { ProductReviewsController } from './product-reviews.controller';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductReview } from './entities/product-review.entity';
import { CommonModule } from '../../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductImage, ProductReview]),
    CacheModule.register(),
    CommonModule,
  ],
  controllers: [ProductsController, ProductsAdminController, ProductReviewsController],
  providers: [ProductsService, ProductReviewsService],
  exports: [ProductsService, ProductReviewsService],
})
export class ProductsModule {}
