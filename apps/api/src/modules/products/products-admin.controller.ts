import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common"
import { FileFieldsInterceptor } from "@nestjs/platform-express"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger"
import { ProductsService } from "./products.service"
import { CreateProductDto } from "./dto/create-product.dto"
import { UpdateProductDto } from "./dto/update-product.dto"
import { SearchProductDto } from "./dto/search-product.dto"
import { AdminProductSearchDto } from "./dto/admin-product-search.dto"
import { ProductBasicDto, ProductSearchBasicResponseDto } from "./dto/product-basic.dto"
import { ProductSlugDto } from "./dto/product-slug.dto"
import { ProductIdDto } from "./dto/product-id.dto"
import { ProductResponseDto } from "./dto/product-response.dto"
import { ProductsQueryDto } from "./dto/products-query.dto"
import { ProductsResponseDto } from "./dto/products-response.dto"
import { ProductSearchResponseDto } from "./dto/product-search-response.dto"
import { ProductWithMessageResponseDto } from "./dto/product-with-message-response.dto"
import { MessageResponseDto } from "./dto/message-response.dto"
import { ProductStockStatus } from "./enums/product-status.enum"
import { Country } from "./enums/country.enum"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { Permissions } from "../auth/decorators/permissions.decorator"
import { CountryHeader } from "../../common/decorators/country.decorator"
import { AdminProductsQueryDto } from "./dto/admin-products-query.dto"
import { S3UploadService } from "../../common/services/s3-upload.service"

@ApiTags("admin / products")
@Controller("admin/products")
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class ProductsAdminController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly s3UploadService: S3UploadService,
  ) {}

  @Post()
  @Permissions("products:write")
  @ApiOperation({ summary: "Create a new product (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Product created successfully",
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:write permission" })
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto)
    return { product }
  }

  @Get()
  @Permissions("products:read")
  @ApiOperation({
    summary: "Get all products with advanced filtering and search (Admin only)",
    description: `
Unified admin endpoint for querying products with comprehensive filtering capabilities.
Supports all query parameters from the public endpoint plus admin-specific features:

- **Admin privileges**: Can query inactive products (isActive parameter)
- **Full filtering**: All filters from public endpoint (categories, types, featured, etc.)
- **Search**: Full-text search across name, description, category, and type
- **Price range**: Filter by minimum and maximum price
- **Sorting**: Multiple sorting options (price, name, date)

When isActive is not provided, returns all products regardless of status.
    `.trim(),
  })
  @ApiHeader({
    name: "x-country",
    description: "Country code (ISO 3166-1 alpha-2) to filter products",
    required: false,
    example: "US",
  })
  @ApiResponse({
    status: 200,
    description: "Products retrieved successfully",
    type: ProductsResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:read permission" })
  async findAll(@Query() queryDto: AdminProductsQueryDto, @CountryHeader() country?: Country) {
    return await this.productsService.findAll(queryDto, country)
  }

  @Get("search/basic")
  @Permissions("products:read")
  @ApiOperation({
    summary: "Search products with basic information (Admin only)",
    description: `
Lightweight endpoint for product selection components.
Returns only essential product information with high limit support (up to 1000 results).

Perfect for:
- Dropdown/select components
- Autocomplete fields
- Product pickers in forms

Returns minimal data: id, name, sku, price, vatPercentage, currency, country, stockQuantity, category, type, isActive
    `.trim(),
  })
  @ApiResponse({
    status: 200,
    description: "Products retrieved successfully",
    type: ProductSearchBasicResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:read permission" })
  async searchBasic(@Query() searchDto: AdminProductSearchDto): Promise<ProductSearchBasicResponseDto> {
    return await this.productsService.searchBasic(searchDto)
  }

  @Get(":slug")
  @Permissions("products:read")
  @ApiOperation({ summary: "Get a product by slug including inactive (Admin only)" })
  @ApiQuery({
    name: "isActive",
    required: false,
    type: Boolean,
    description:
      "Filter by active status (true/false). If not provided, returns product regardless of status.",
  })
  @ApiResponse({
    status: 200,
    description: "Product retrieved successfully",
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:read permission" })
  async findOne(@Param() params: ProductSlugDto, @Query("isActive") isActive?: string) {
    const filterActive = isActive === "true" ? true : isActive === "false" ? false : undefined
    const product = await this.productsService.findBySlugAdmin(params.slug, filterActive)
    return { product }
  }

  @Patch(":id")
  @Permissions("products:write")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "coverImage", maxCount: 1 },
      { name: "images", maxCount: 10 },
    ]),
  )
  @ApiConsumes("multipart/form-data", "application/json")
  @ApiOperation({
    summary: "Update a product with optional file uploads (Admin only)",
    description: `
Update product details including optional cover image and additional images.
- Supports both multipart/form-data (with files) and application/json (without files)
- coverImage: Single file for product cover image
- images: Array of up to 10 images for product gallery
- All other fields from UpdateProductDto can be included
    `.trim(),
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        coverImage: {
          type: "string",
          format: "binary",
          description: "Cover image file (optional)",
        },
        images: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          description: "Product images (optional, max 10)",
        },
        name: { type: "string", description: "Product name" },
        description: { type: "string", description: "Product description" },
        price: { type: "number", description: "Product price" },
        stockQuantity: { type: "number", description: "Stock quantity" },
        category: { type: "string", description: "Product category" },
        type: { type: "string", description: "Product type" },
        isActive: { type: "boolean", description: "Active status" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Product updated successfully",
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:write permission" })
  async update(
    @Param() params: ProductIdDto,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files?: {
      coverImage?: Express.Multer.File[]
      images?: Express.Multer.File[]
    },
  ) {
    // Upload cover image if provided
    if (files?.coverImage?.[0]) {
      const coverImageFile = await this.s3UploadService.uploadFile(
        files.coverImage[0],
        "products/covers",
        undefined,
        "product",
        +params.id,
      )
      updateProductDto.coverImageId = coverImageFile.id
    }

    // Upload additional images if provided
    let imageFileIds: number[] = []
    if (files?.images && files.images.length > 0) {
      const uploadedImages = await Promise.all(
        files.images.map((file) =>
          this.s3UploadService.uploadFile(file, "products/images", undefined, "product", +params.id),
        ),
      )
      imageFileIds = uploadedImages.map((img) => img.id)
    }

    // Update product
    const product = await this.productsService.updateWithImages(
      +params.id,
      updateProductDto,
      imageFileIds,
    )

    return { product }
  }

  @Patch(":id/stock")
  @Permissions("products:write")
  @ApiOperation({ summary: "Update product stock (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Stock updated successfully",
    type: ProductWithMessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:write permission" })
  async updateStock(@Param() params: ProductIdDto, @Body("stockQuantity") stockQuantity: number) {
    const product = await this.productsService.updateStock(+params.id, stockQuantity)
    return { product, message: "Stock updated successfully" }
  }

  @Patch(":id/featured")
  @Permissions("products:write")
  @ApiOperation({ summary: "Toggle product featured status (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Featured status updated successfully",
    type: ProductWithMessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:write permission" })
  async toggleFeatured(@Param() params: ProductIdDto, @Body("isFeatured") isFeatured: boolean) {
    const product = await this.productsService.toggleFeatured(+params.id, isFeatured)
    return { product, message: "Featured status updated successfully" }
  }

  @Patch(":id/discount")
  @Permissions("products:write")
  @ApiOperation({ summary: "Set product discount (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Discount applied successfully",
    type: ProductWithMessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 400, description: "Invalid discount percentage" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:write permission" })
  async setDiscount(
    @Param() params: ProductIdDto,
    @Body("discountPercentage") discountPercentage: number,
  ) {
    const product = await this.productsService.setDiscount(+params.id, discountPercentage)
    return { product, message: "Discount applied successfully" }
  }

  @Patch(":id/stock-status")
  @Permissions("products:write")
  @ApiOperation({ summary: "Set product stock status (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Stock status updated successfully",
    type: ProductWithMessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:write permission" })
  async setStockStatus(
    @Param() params: ProductIdDto,
    @Body("stockStatus") stockStatus: ProductStockStatus,
  ) {
    const product = await this.productsService.setStockStatus(+params.id, stockStatus)
    return { product, message: "Stock status updated successfully" }
  }

  @Delete(":id")
  @Permissions("products:delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a product (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Product deleted successfully",
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:delete permission" })
  async remove(@Param() params: ProductIdDto) {
    await this.productsService.remove(+params.id)
    return { message: "Product deleted successfully" }
  }

  @Post(":id/images")
  @Permissions("products:write")
  @ApiOperation({ summary: "Add images to a product (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Images added to product successfully",
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:write permission" })
  async addImages(@Param() params: ProductIdDto, @Body("fileIds") fileIds: number[]) {
    const images = await this.productsService.addProductImages(+params.id, fileIds)
    return { images, message: "Images added to product successfully" }
  }

  @Patch(":id/cover-image")
  @Permissions("products:write")
  @ApiOperation({ summary: "Set product cover image (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Cover image set successfully",
    type: ProductWithMessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product or image not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:write permission" })
  async setCoverImage(@Param() params: ProductIdDto, @Body("fileId") fileId: number) {
    const product = await this.productsService.setCoverImage(+params.id, fileId)
    return { product, message: "Cover image set successfully" }
  }

  @Delete(":id/images/:imageId")
  @Permissions("products:delete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a product image (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Product image deleted successfully",
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product or image not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires products:delete permission" })
  async deleteImage(@Param() params: ProductIdDto, @Param("imageId") imageId: string) {
    await this.productsService.deleteProductImage(+params.id, +imageId)
    return { message: "Product image deleted successfully" }
  }
}
