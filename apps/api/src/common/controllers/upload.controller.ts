import {
  Controller,
  Get,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  Query,
} from "@nestjs/common"
import { FileInterceptor } from "@nestjs/platform-express"
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery } from "@nestjs/swagger"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { S3UploadService } from "../services/s3-upload.service"
import { File } from "../entities/file.entity"
import { Roles } from "../../modules/auth/decorators/roles.decorator"
import { RolesGuard } from "../../modules/auth/guards/roles.guard"

@ApiTags("admin/files")
@Controller("admin/files")
@UseGuards(RolesGuard)
export class UploadController {
  constructor(
    private readonly s3UploadService: S3UploadService,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  @Get()
  @Roles("admin")
  @ApiOperation({ summary: "Get all files with pagination (Admin only)" })
  @ApiQuery({ name: "page", required: false, description: "Page number", example: 1 })
  @ApiQuery({ name: "limit", required: false, description: "Items per page", example: 50 })
  @ApiQuery({ name: "folder", required: false, description: "Filter by folder" })
  @ApiQuery({ name: "entityType", required: false, description: "Filter by entity type" })
  @ApiResponse({
    status: 200,
    description: "Files retrieved successfully",
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: { $ref: "#/components/schemas/File" },
        },
        pagination: {
          type: "object",
          properties: {
            total: { type: "number" },
            page: { type: "number" },
            limit: { type: "number" },
            totalPages: { type: "number" },
            hasNextPage: { type: "boolean" },
            hasPreviousPage: { type: "boolean" },
          },
        },
      },
    },
  })
  async getFiles(
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "50",
    @Query("folder") folder?: string,
    @Query("entityType") entityType?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1
    const limitNum = parseInt(limit, 10) || 50
    const skip = (pageNum - 1) * limitNum

    const queryBuilder = this.fileRepository.createQueryBuilder("file")

    if (folder) {
      queryBuilder.andWhere("file.folder = :folder", { folder })
    }

    if (entityType) {
      queryBuilder.andWhere("file.entityType = :entityType", { entityType })
    }

    queryBuilder.orderBy("file.createdAt", "DESC").skip(skip).take(limitNum)

    const [files, total] = await queryBuilder.getManyAndCount()

    const totalPages = Math.ceil(total / limitNum)

    return {
      files,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    }
  }

  @Post()
  @Roles("admin")
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload file to S3/MinIO (Admin only)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
        folder: {
          type: "string",
          description: "Optional folder name (default: uploads)",
        },
        title: {
          type: "string",
          description: "Optional file title",
        },
        description: {
          type: "string",
          description: "Optional file description",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "File uploaded successfully",
    schema: {
      type: "object",
      properties: {
        url: { type: "string" },
        message: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - Invalid file" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async uploadFile(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body("folder") folder?: string,
    @Body("title") title?: string,
    @Body("description") description?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file uploaded")
    }

    // Validate file type (images, videos, and common document types)
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "Invalid file type. Allowed types: JPEG, PNG, WebP, GIF, MP4, MPEG, MOV, AVI, WebM, PDF, DOC, DOCX",
      )
    }

    // Validate file size (max 10MB for images/docs, 100MB for videos)
    const isVideo = file.mimetype.startsWith("video/")
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024 // 100MB for videos, 10MB for others
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size too large. Maximum size is ${isVideo ? "100MB" : "10MB"}`,
      )
    }

    const folderName = folder || "uploads"
    const userId = req.user?.id
    const fileEntity = await this.s3UploadService.uploadFile(file, folderName, userId)

    // Update title and description if provided
    if (title || description) {
      if (title) fileEntity.title = title
      if (description) fileEntity.description = description
      await this.fileRepository.save(fileEntity)
    }

    return {
      id: fileEntity.id,
      url: fileEntity.url,
      originalName: fileEntity.originalName,
      size: fileEntity.size,
      mimeType: fileEntity.mimeType,
      message: "File uploaded successfully",
    }
  }

  @Delete()
  @Roles("admin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete file from S3/MinIO (Admin only)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Full URL of the file to delete",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "File deleted successfully" })
  @ApiResponse({ status: 400, description: "Bad request - Invalid URL" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async deleteFile(@Body("url") url: string) {
    if (!url) {
      throw new BadRequestException("File URL is required")
    }

    await this.s3UploadService.deleteFile(url)

    return {
      message: "File deleted successfully",
    }
  }

  @Post("multiple")
  @Roles("admin")
  @UseInterceptors(FileInterceptor("files"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload multiple files to S3/MinIO (Admin only)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
        },
        folder: {
          type: "string",
          description: "Optional folder name (default: uploads)",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Files uploaded successfully",
    schema: {
      type: "object",
      properties: {
        urls: {
          type: "array",
          items: { type: "string" },
        },
        message: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - Invalid files" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async uploadMultipleFiles(
    @UploadedFile() files: Express.Multer.File[],
    @Body("folder") folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded")
    }

    const folderName = folder || "uploads"
    const fileUrls = await this.s3UploadService.uploadMultipleFiles(files, folderName)

    return {
      urls: fileUrls,
      message: `${files.length} files uploaded successfully`,
    }
  }
}
