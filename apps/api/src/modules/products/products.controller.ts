import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger"
import { ProductsService } from "./products.service"
import { SearchProductDto } from "./dto/search-product.dto"
import { ProductResponseDto } from "./dto/product-response.dto"
import { ProductsResponseDto } from "./dto/products-response.dto"
import { CategoriesResponseDto } from "./dto/categories-response.dto"
import { CategoryTypesResponseDto } from "./dto/category-types-response.dto"
import { TaxonomyResponseDto } from "./dto/taxonomy-response.dto"
import { ProductSearchResponseDto } from "./dto/product-search-response.dto"
import {
  ProductCategory,
  getTypesForCategory,
  CATEGORY_TYPE_MAP,
} from "./enums/product-category.enum"
import { Country } from "./enums/country.enum"
import { Public } from "../auth/decorators/public.decorator"
import { RelaxedThrottle } from "../../common/decorators/api-throttle.decorator"
import { RolesGuard } from "../auth/guards/roles.guard"
import { CountryHeader } from "../../common/decorators/country.decorator"
import { ProductsQueryDto } from "./dto/products-query.dto"

@ApiTags("products")
@Controller("products")
@UseGuards(RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @RelaxedThrottle()
  @Get()
  @ApiOperation({
    summary: "Get all products with advanced filtering and search",
    description: `
      Unified endpoint for querying products with comprehensive filtering, search, and sorting capabilities.
      Supports:
      - Full-text search (query parameter)
      - Category/type filtering (single or multiple)
      - Featured/new arrivals filtering
      - Price range filtering
      - Stock status filtering
      - Multiple sorting options
      - Pagination
    `,
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
  async findAll(@Query() queryDto: ProductsQueryDto, @CountryHeader() country?: Country) {
    return await this.productsService.findAll(queryDto, country)
  }

  @Public()
  @Get("categories")
  @ApiOperation({ summary: "Get all product categories" })
  @ApiResponse({
    status: 200,
    description: "Categories retrieved successfully",
    type: CategoriesResponseDto,
  })
  getCategories() {
    return {
      categories: Object.values(ProductCategory),
    }
  }

  @Public()
  @Get("categories/:category/types")
  @ApiOperation({ summary: "Get valid product types for a category" })
  @ApiResponse({
    status: 200,
    description: "Types retrieved successfully",
    type: CategoryTypesResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid category" })
  getTypesForCategory(@Param("category") category: ProductCategory) {
    const types = getTypesForCategory(category)
    return {
      category,
      types,
    }
  }

  @Public()
  @Get("taxonomy")
  @ApiOperation({ summary: "Get complete product taxonomy (categories with their types)" })
  @ApiResponse({
    status: 200,
    description: "Taxonomy retrieved successfully",
    type: TaxonomyResponseDto,
  })
  getTaxonomy() {
    return {
      taxonomy: CATEGORY_TYPE_MAP,
    }
  }

  /**
   * @deprecated Use GET /products instead with query parameters
   * This endpoint is maintained for backward compatibility
   */
  @Public()
  @RelaxedThrottle()
  @Get("search")
  @ApiOperation({
    summary: "Search products (DEPRECATED - use GET /products instead)",
    description:
      "This endpoint is deprecated. Use GET /products with query parameters for the same functionality.",
    deprecated: true,
  })
  @ApiHeader({
    name: "x-country",
    description: "Country code (ISO 3166-1 alpha-2) to filter products",
    required: false,
    example: "US",
  })
  @ApiResponse({
    status: 200,
    description: "Products search results",
    type: ProductSearchResponseDto,
  })
  async search(@Query() searchDto: SearchProductDto, @CountryHeader() country?: Country) {
    // Convert SearchProductDto to ProductsQueryDto for compatibility
    const queryDto: ProductsQueryDto = {
      query: searchDto.query,
      page: searchDto.page,
      limit: searchDto.limit,
      categories: searchDto.categories,
      types: searchDto.types,
      featured: searchDto.featured,
      newArrival: searchDto.newArrival,
      outOfStock: searchDto.outOfStock,
      sortBy: searchDto.sortBy,
      minPrice: searchDto.minPrice,
      maxPrice: searchDto.maxPrice,
      isActive: searchDto.isActive,
    }

    const { products, pagination } = await this.productsService.findAll(queryDto, country)

    // Return in the same format as before for backward compatibility
    return {
      products,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.hasNextPage,
        hasPreviousPage: pagination.hasPreviousPage,
      },
    }
  }

  @Public()
  @RelaxedThrottle()
  @Get(":identifier")
  @ApiOperation({ summary: "Get a product by slug or ID (active products only)" })
  @ApiResponse({
    status: 200,
    description: "Product retrieved successfully",
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: "Product not found" })
  async findOne(@Param("identifier") identifier: string) {
    // Check if identifier is numeric (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier)

    let product: any
    if (isNumeric) {
      product = await this.productsService.findById(parseInt(identifier, 10))
    } else {
      product = await this.productsService.findBySlug(identifier)
    }

    return { product }
  }
}
