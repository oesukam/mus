import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CacheModule } from "@nestjs/cache-manager"
import { FeatureFlag } from "./entities/feature-flag.entity"
import { FeatureFlagService } from "./feature-flag.service"
import { FeatureFlagsAdminController } from "./features-flags-admin.controller"
import { FeatureFlagsUserController } from "./features-flags-user.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([FeatureFlag]),
    CacheModule.register(),
  ],
  controllers: [FeatureFlagsAdminController, FeatureFlagsUserController],
  providers: [FeatureFlagService],
  exports: [FeatureFlagService],
})
export class FeatureFlagModule {}
