import { Module, Global } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { ConfigModule } from "@nestjs/config"
import { S3UploadService } from "./services/s3-upload.service"
import { UploadController } from "./controllers/upload.controller"
import { File } from "./entities/file.entity"
import { CustomLoggerService } from "./services/logger.service"

@Global()
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([File])],
  controllers: [UploadController],
  providers: [S3UploadService, CustomLoggerService],
  exports: [S3UploadService, CustomLoggerService],
})
export class CommonModule {}
