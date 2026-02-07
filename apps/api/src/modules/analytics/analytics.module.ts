import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AnalyticsController } from "./analytics.controller"
import { AnalyticsService } from "./analytics.service"
import { Order } from "../orders/entities/order.entity"
import { Product } from "../products/entities/product.entity"
import { User } from "../users/entities/user.entity"

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product, User])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
