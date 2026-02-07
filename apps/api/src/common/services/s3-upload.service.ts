import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { File } from '../entities/file.entity';
import { createThumbnail, createMediumImage, createLargeImage } from '../../database/utils/image-seeder.util';

@Injectable()
export class S3UploadService {
  private readonly logger = new Logger(S3UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly endpoint: string | undefined;
  private readonly forcePathStyle: boolean;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {
    this.region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME', '');
    this.endpoint = this.configService.get<string>('S3_ENDPOINT');
    this.forcePathStyle = this.configService.get<boolean>('S3_FORCE_PATH_STYLE', false);

    const s3Config: any = {
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    };

    // MinIO compatibility: set custom endpoint and force path style
    if (this.endpoint) {
      s3Config.endpoint = this.endpoint;
      s3Config.forcePathStyle = this.forcePathStyle;
      this.logger.log(`Using custom S3 endpoint: ${this.endpoint}`);
    }

    this.s3Client = new S3Client(s3Config);
  }

  private isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  private isVideoFile(mimetype: string): boolean {
    return mimetype.startsWith('video/');
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'products',
    userId?: number,
    entityType?: string,
    entityId?: number,
  ): Promise<File> {
    const fileExtension = file.originalname.split('.').pop();
    const uuid = uuidv4();
    const fileName = `${folder}/${uuid}.${fileExtension}`;

    try {
      // Helper function to upload a file to S3
      const uploadToS3 = async (key: string, buffer: Buffer, contentType: string) => {
        const params: any = {
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        };

        if (!this.endpoint) {
          params.ACL = 'public-read';
        }

        const command = new PutObjectCommand(params);
        await this.s3Client.send(command);
      };

      // Upload original file
      await uploadToS3(fileName, file.buffer, file.mimetype);

      // Generate file URL for original
      const fileUrl = this.getFileUrl(fileName);
      this.logger.log(`File uploaded successfully: ${fileUrl}`);

      // Initialize URLs for different sizes
      let urlThumbnail: string | null = null;
      let urlMedium: string | null = null;
      let urlLarge: string | null = null;

      // If it's an image, generate and upload additional sizes
      if (this.isImageFile(file.mimetype)) {
        try {
          const thumbFileName = `${folder}/${uuid}-thumb.${fileExtension}`;
          const mediumFileName = `${folder}/${uuid}-medium.${fileExtension}`;
          const largeFileName = `${folder}/${uuid}-large.${fileExtension}`;

          // Generate resized images
          const [thumbnailBuffer, mediumBuffer, largeBuffer] = await Promise.all([
            createThumbnail(file.buffer),
            createMediumImage(file.buffer),
            createLargeImage(file.buffer),
          ]);

          // Upload all sizes to S3
          await Promise.all([
            uploadToS3(thumbFileName, thumbnailBuffer, 'image/jpeg'),
            uploadToS3(mediumFileName, mediumBuffer, 'image/jpeg'),
            uploadToS3(largeFileName, largeBuffer, 'image/jpeg'),
          ]);

          // Generate URLs for all sizes
          urlThumbnail = this.getFileUrl(thumbFileName);
          urlMedium = this.getFileUrl(mediumFileName);
          urlLarge = this.getFileUrl(largeFileName);

          this.logger.log(`Image sizes generated: thumbnail, medium, large`);
        } catch (imageError) {
          this.logger.warn(`Failed to generate image sizes: ${imageError.message}`);
          // Continue without additional sizes
        }
      }

      // If it's a video, log upload (thumbnail generation could be added with ffmpeg in the future)
      if (this.isVideoFile(file.mimetype)) {
        this.logger.log(`Video file uploaded: ${fileUrl}`);
        // TODO: Add video thumbnail generation using ffmpeg if needed
        // This would require installing fluent-ffmpeg package and having ffmpeg binary available
      }

      // Save file metadata to database
      const fileEntity = this.fileRepository.create({
        key: fileName,
        url: fileUrl,
        urlThumbnail,
        urlMedium,
        urlLarge,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        folder,
        uploadedBy: userId,
        entityType,
        entityId,
      });

      await this.fileRepository.save(fileEntity);

      return fileEntity;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`, error.stack);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  private getFileUrl(fileName: string): string {
    if (this.endpoint) {
      // MinIO or custom S3-compatible endpoint
      const endpointUrl = this.endpoint.replace(/\/$/, '');
      return `${endpointUrl}/${this.bucketName}/${fileName}`;
    } else {
      // AWS S3
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Find file in database
      const fileEntity = await this.fileRepository.findOne({ where: { url: fileUrl } });

      // Extract the key from the URL
      const url = new URL(fileUrl);
      let key = url.pathname.substring(1); // Remove leading '/'

      // For MinIO URLs, remove the bucket name from the path
      if (this.endpoint && key.startsWith(`${this.bucketName}/`)) {
        key = key.substring(this.bucketName.length + 1);
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully from S3: ${key}`);

      // Delete file record from database
      if (fileEntity) {
        await this.fileRepository.remove(fileEntity);
        this.logger.log(`File record deleted from database: ${fileEntity.id}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'products',
    userId?: number,
    entityType?: string,
    entityId?: number,
  ): Promise<File[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, folder, userId, entityType, entityId),
    );
    return Promise.all(uploadPromises);
  }
}
