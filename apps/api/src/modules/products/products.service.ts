import { Injectable, NotFoundException, BadRequestException, Inject } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { CACHE_MANAGER } from "@nestjs/cache-manager"
import { Cache } from "cache-manager"
import { Product } from "./entities/product.entity"
import { ProductImage } from "./entities/product-image.entity"
import { CreateProductDto } from "./dto/create-product.dto"
import { UpdateProductDto } from "./dto/update-product.dto"
import { SearchProductDto } from "./dto/search-product.dto"
import { ProductStockStatus } from "./enums/product-status.enum"
import { Country } from "./enums/country.enum"
import { PaginationMetaDto } from "../../common/dto/pagination-meta.dto"
import { ProductsQueryDto, SortBy } from "./dto/products-query.dto"
import { AdminProductsQueryDto } from "./dto/admin-products-query.dto"

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private productImagesRepository: Repository<ProductImage>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  /**
   * Calculate and add discountedPrice and discount fields to a product
   * @param product - The product to enrich with discount calculations
   * @returns The product with calculated discount fields
   */
  private enrichProductWithDiscount<T extends Product>(product: T): T {
    if (product.discountPercentage && product.discountPercentage > 0) {
      product.discountedPrice =
        Number(product.price) * (1 - Number(product.discountPercentage) / 100)
    } else {
      product.discountedPrice = Number(product.price)
    }
    return product
  }

  /**
   * Calculate and add discountedPrice and discount fields to multiple products
   * @param products - Array of products to enrich
   * @returns Array of products with calculated discount fields
   */
  private enrichProductsWithDiscount<T extends Product>(products: T[]): T[] {
    return products.map((product) => this.enrichProductWithDiscount(product))
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Generate slug from name if not provided
    if (!createProductDto.slug) {
      createProductDto.slug = this.generateSlug(createProductDto.name)
    }

    // Check if slug already exists
    const existingProduct = await this.productsRepository.findOne({
      where: { slug: createProductDto.slug },
    })

    if (existingProduct) {
      // Append a random suffix to make it unique
      createProductDto.slug = `${createProductDto.slug}-${Date.now()}`
    }

    const product = this.productsRepository.create(createProductDto)

    // Auto-update stock status based on stock quantity
    if (createProductDto.stockQuantity === 0) {
      product.stockStatus = ProductStockStatus.OUT_OF_STOCK
    }

    const savedProduct = await this.productsRepository.save(product)
    await this.cacheManager.del("products:all")
    return this.enrichProductWithDiscount(savedProduct)
  }

  /**
   * Unified method to query products with all filtering, search, and sorting capabilities
   * Replaces both findAll and search methods to avoid duplication
   * @param queryDto - Query parameters for filtering and pagination
   * @param country - Optional country filter
   * @param forAdmin - If true, allows isActive to be undefined (show all products). If false, defaults to active only.
   */
  async findAll(
    queryDto: ProductsQueryDto | AdminProductsQueryDto,
    country?: Country,
  ): Promise<{ products: Product[]; pagination: PaginationMetaDto }> {
    const {
      query,
      page = 1,
      limit = 10,
      categories,
      type,
      types,
      featured,
      newArrival,
      outOfStock,
      sortBy = SortBy.NEWEST,
      minPrice,
      maxPrice,
      isActive,
    } = queryDto

    console.log(queryDto, "=========queryDto=========")

    const skip = (page - 1) * limit

    // Build the query
    const queryBuilder = this.productsRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.coverImage", "coverImage")

    // Add fulltext search if query is provided
    if (query) {
      const searchQuery = query.trim().replace(/\s+/g, " & ")
      queryBuilder.where("product.searchVector @@ to_tsquery(:searchQuery)", { searchQuery })
    }

    // Filter by isActive
    if (isActive !== undefined) {
      if (query) {
        queryBuilder.andWhere("product.isActive = :isActive", { isActive })
      } else {
        queryBuilder.where("product.isActive = :isActive", { isActive })
      }
    }

    // Combine single category with categories array
    const allCategories = []
    if (categories && categories.length > 0) allCategories.push(...categories)

    if (allCategories.length > 0) {
      queryBuilder.andWhere("product.category IN (:...categories)", {
        categories: [...new Set(allCategories)], // Remove duplicates
      })
    }

    // Combine single type with types array
    const allTypes = []
    if (type) allTypes.push(type)
    if (types && types.length > 0) allTypes.push(...types)

    if (allTypes.length > 0) {
      queryBuilder.andWhere("product.type IN (:...types)", {
        types: [...new Set(allTypes)], // Remove duplicates
      })
    }

    // Add featured filter
    if (featured !== undefined) {
      queryBuilder.andWhere("product.isFeatured = :featured", { featured })
    }

    // Add new arrival filter (products created in last 30 days)
    if (newArrival) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      queryBuilder.andWhere("product.createdAt >= :thirtyDaysAgo", { thirtyDaysAgo })
    }

    // Add out of stock filter
    if (outOfStock !== undefined) {
      if (outOfStock) {
        queryBuilder.andWhere("product.stockQuantity = :stockQuantity", { stockQuantity: 0 })
      } else {
        queryBuilder.andWhere("product.stockQuantity > :stockQuantity", { stockQuantity: 0 })
      }
    }

    // Add price range filters
    if (minPrice !== undefined) {
      queryBuilder.andWhere("product.price >= :minPrice", { minPrice })
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere("product.price <= :maxPrice", { maxPrice })
    }

    // Add country filter
    if (country) {
      queryBuilder.andWhere("product.country = :country", { country })
    }

    // Apply sorting
    // Check if admin-specific sorting fields are provided
    const adminQueryDto = queryDto as AdminProductsQueryDto
    if (adminQueryDto.sortByField && adminQueryDto.sortOrder) {
      const sortFieldMap: Record<string, string> = {
        name: "product.name",
        price: "product.price",
        stockQuantity: "product.stockQuantity",
        category: "product.category",
        type: "product.type",
        country: "product.country",
        createdAt: "product.createdAt",
        updatedAt: "product.updatedAt",
        isActive: "product.isActive",
      }
      const sortField = sortFieldMap[adminQueryDto.sortByField] || "product.createdAt"
      const order = adminQueryDto.sortOrder.toUpperCase() as "ASC" | "DESC"
      queryBuilder.orderBy(sortField, order)
    } else {
      // Use enum-based sorting for public API
      switch (sortBy) {
        case SortBy.PRICE_LOW:
          queryBuilder.orderBy("product.price", "ASC")
          break
        case SortBy.PRICE_HIGH:
          queryBuilder.orderBy("product.price", "DESC")
          break
        case SortBy.NAME_ASC:
          queryBuilder.orderBy("product.name", "ASC")
          break
        case SortBy.NAME_DESC:
          queryBuilder.orderBy("product.name", "DESC")
          break
        case SortBy.OLDEST:
          queryBuilder.orderBy("product.createdAt", "ASC")
          break
        case SortBy.NEWEST:
        default:
          queryBuilder.orderBy("product.createdAt", "DESC")
          break
      }
    }

    // Get total count before pagination
    const total = await queryBuilder.getCount()

    // Apply pagination
    const products = await queryBuilder.skip(skip).take(limit).getMany()

    // Enrich products with calculated discount fields
    const enrichedProducts = this.enrichProductsWithDiscount(products)

    const pagination = new PaginationMetaDto(total, page, limit)

    return {
      products: enrichedProducts,
      pagination,
    }
  }

  async searchBasic(searchDto: any): Promise<any> {
    const { q, limit = 100, isActive = true } = searchDto

    // Build the query - select only basic fields
    const queryBuilder = this.productsRepository
      .createQueryBuilder("product")
      .select([
        "product.id",
        "product.name",
        "product.price",
        "product.vatPercentage",
        "product.currency",
        "product.country",
        "product.stockQuantity",
        "product.category",
        "product.type",
        "product.isActive",
      ])

    // Filter by isActive
    queryBuilder.where("product.isActive = :isActive", { isActive })

    // Add search if query is provided
    if (q && q.trim()) {
      const searchTerm = `%${q.trim().toLowerCase()}%`
      queryBuilder.andWhere(
        "(LOWER(product.name) LIKE :searchTerm OR LOWER(product.description) LIKE :searchTerm)",
        { searchTerm },
      )
    }

    // Order by name
    queryBuilder.orderBy("product.name", "ASC")

    // Limit results
    queryBuilder.take(limit)

    // Get results and count
    const [products, total] = await queryBuilder.getManyAndCount()

    // Enrich products with calculated discount fields
    const enrichedProducts = this.enrichProductsWithDiscount(products)

    return {
      products: enrichedProducts,
      total,
      limit,
    }
  }

  async findOne(id: number): Promise<Product> {
    const cacheKey = `products:${id}`
    const cached = await this.cacheManager.get<Product>(cacheKey)

    if (cached) {
      return this.enrichProductWithDiscount(cached)
    }

    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ["coverImage", "images", "images.file"],
      select: {
        coverImage: {
          url: true,
          urlThumbnail: true,
          urlMedium: true,
          urlLarge: true,
        },
        images: {
          file: {
            url: true,
            urlThumbnail: true,
            urlMedium: true,
            urlLarge: true,
          },
        },
      },
    })
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }

    // Enrich product with calculated discount fields
    const enrichedProduct = this.enrichProductWithDiscount(product)

    // Cache for 5 minutes (300000ms)
    await this.cacheManager.set(cacheKey, enrichedProduct, 300000)
    return enrichedProduct
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { slug, isActive: true },
      relations: ["coverImage", "images", "images.file"],
    })

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`)
    }

    return this.enrichProductWithDiscount(product)
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, isActive: true },
      relations: ["coverImage", "images", "images.file"],
    })

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`)
    }

    return this.enrichProductWithDiscount(product)
  }

  async findBySlugAdmin(slug: string, isActive?: boolean): Promise<Product> {
    const where: any = { slug }
    if (isActive !== undefined) {
      where.isActive = isActive
    }

    const product = await this.productsRepository.findOne({
      where,
      relations: ["coverImage", "images", "images.file"],
      select: {
        coverImage: {
          url: true,
          urlThumbnail: true,
          urlMedium: true,
          urlLarge: true,
        },
        images: {
          file: {
            url: true,
            urlThumbnail: true,
            urlMedium: true,
            urlLarge: true,
          },
        },
      },
    })

    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`)
    }

    return this.enrichProductWithDiscount(product)
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id)
    const oldSlug = product.slug

    Object.assign(product, updateProductDto)

    // Auto-update stock status based on stock quantity if stock was updated
    if (updateProductDto.stockQuantity !== undefined) {
      if (updateProductDto.stockQuantity === 0) {
        product.stockStatus = ProductStockStatus.OUT_OF_STOCK
      } else if (product.stockStatus === ProductStockStatus.OUT_OF_STOCK) {
        // If product was out of stock and now has stock, set to in stock
        product.stockStatus = ProductStockStatus.IN_STOCK
      }
    }

    const updatedProduct = await this.productsRepository.save(product)

    await this.cacheManager.del(`products:${id}`)
    await this.cacheManager.del(`products:slug:${oldSlug}`)
    if (updatedProduct.slug !== oldSlug) {
      await this.cacheManager.del(`products:slug:${updatedProduct.slug}`)
    }
    await this.cacheManager.del("products:all")

    return this.enrichProductWithDiscount(updatedProduct)
  }

  async updateWithImages(
    id: number,
    updateProductDto: UpdateProductDto,
    imageFileIds: number[] = [],
  ): Promise<Product> {
    // Update product basic info
    await this.update(id, updateProductDto)

    // Add new product images if provided
    if (imageFileIds.length > 0) {
      // Get the current highest order value
      const existingImages = await this.productImagesRepository.find({
        where: { productId: id },
        order: { order: "DESC" },
      })

      const startOrder = existingImages.length > 0 ? existingImages[0].order + 1 : 0

      // Create product image entries
      const productImages = imageFileIds.map((fileId, index) => {
        const productImage = new ProductImage()
        productImage.productId = id
        productImage.fileId = fileId
        productImage.order = startOrder + index
        productImage.isPrimary = false
        return productImage
      })

      await this.productImagesRepository.save(productImages)
    }

    // Return updated product with images
    return await this.findOne(id)
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id)
    const slug = product.slug
    await this.productsRepository.remove(product)

    await this.cacheManager.del(`products:${id}`)
    await this.cacheManager.del(`products:slug:${slug}`)
    await this.cacheManager.del("products:all")
  }

  async search(
    searchDto: SearchProductDto,
    country?: Country,
  ): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
    const {
      query,
      page = 1,
      limit = 10,
      categories,
      types,
      featured,
      newArrival,
      outOfStock,
      sortBy = "newest",
      minPrice,
      maxPrice,
    } = searchDto
    const skip = (page - 1) * limit

    // Create cache key based on all search parameters including country
    // const categoriesKey = categories?.sort().join(",") || "all"
    // const typesKey = types?.sort().join(",") || "all"
    // const countryKey = country || "all"
    // const cacheKey = `products:search:${query || "all"}:${page}:${limit}:${categoriesKey}:${typesKey}:${featured || "all"}:${newArrival || "all"}:${outOfStock || "all"}:${sortBy}:${minPrice || 0}:${maxPrice || "max"}:${countryKey}:activeOnly`
    // const cached = await this.cacheManager.get<{
    //   products: Product[]
    //   total: number
    //   page: number
    //   limit: number
    // }>(cacheKey)

    // if (cached) {
    //   return cached
    // }

    // Build the query
    const queryBuilder = this.productsRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.coverImage", "coverImage")

    // Add fulltext search using tsvector for better performance
    if (query) {
      // Use PostgreSQL's ts_query for full-text search
      const searchQuery = query.trim().replace(/\s+/g, " & ")
      queryBuilder.where("product.searchVector @@ to_tsquery(:searchQuery)", { searchQuery })
    }

    // Filter by isActive (active products only for public search)
    if (query) {
      queryBuilder.andWhere("product.isActive = :isActive", { isActive: true })
    } else {
      queryBuilder.where("product.isActive = :isActive", { isActive: true })
    }

    // Add categories filter if provided (supports multiple)
    if (categories && categories.length > 0) {
      queryBuilder.andWhere("product.category IN (:...categories)", { categories })
    }

    // Add types filter if provided (supports multiple)
    if (types && types.length > 0) {
      queryBuilder.andWhere("product.type IN (:...types)", { types })
    }

    // Add featured filter
    if (featured !== undefined) {
      queryBuilder.andWhere("product.isFeatured = :featured", { featured })
    }

    // Add new arrival filter (products created in last 30 days)
    if (newArrival) {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      queryBuilder.andWhere("product.createdAt >= :thirtyDaysAgo", { thirtyDaysAgo })
    }

    // Add out of stock filter
    if (outOfStock !== undefined) {
      if (outOfStock) {
        queryBuilder.andWhere("product.stockQuantity = :stockQuantity", { stockQuantity: 0 })
      } else {
        queryBuilder.andWhere("product.stockQuantity > :stockQuantity", { stockQuantity: 0 })
      }
    }

    // Add price range filters
    if (minPrice !== undefined) {
      queryBuilder.andWhere("product.price >= :minPrice", { minPrice })
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere("product.price <= :maxPrice", { maxPrice })
    }

    // Add country filter
    if (country) {
      queryBuilder.andWhere("product.country = :country", { country })
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        queryBuilder.orderBy("product.price", "ASC")
        break
      case "price-high":
        queryBuilder.orderBy("product.price", "DESC")
        break
      case "name-asc":
        queryBuilder.orderBy("product.name", "ASC")
        break
      case "name-desc":
        queryBuilder.orderBy("product.name", "DESC")
        break
      case "oldest":
        queryBuilder.orderBy("product.createdAt", "ASC")
        break
      case "newest":
      default:
        queryBuilder.orderBy("product.createdAt", "DESC")
        break
    }

    // Get total count for pagination
    const total = await queryBuilder.getCount()

    // Add pagination and execute
    const products = await queryBuilder.skip(skip).take(limit).getMany()

    // Enrich products with calculated discount fields
    const enrichedProducts = this.enrichProductsWithDiscount(products)

    console.log(enrichedProducts, "=========products=========")
    const result = { products: enrichedProducts, total, page, limit }

    // Cache the results
    // await this.cacheManager.set(cacheKey, result, 300) // Cache for 5 minutes

    return result
  }

  async updateStock(id: number, stockQuantity: number): Promise<Product> {
    if (stockQuantity < 0) {
      throw new BadRequestException("Stock cannot be negative")
    }

    const product = await this.findOne(id)
    product.stockQuantity = stockQuantity

    // Auto-update stock status based on stock quantity
    if (stockQuantity === 0) {
      product.stockStatus = ProductStockStatus.OUT_OF_STOCK
    } else if (product.stockStatus === ProductStockStatus.OUT_OF_STOCK) {
      // If product was out of stock and now has stock, set to in stock
      product.stockStatus = ProductStockStatus.IN_STOCK
    }

    const updatedProduct = await this.productsRepository.save(product)

    await this.cacheManager.del(`products:${id}`)
    await this.cacheManager.del(`products:slug:${product.slug}`)
    await this.cacheManager.del("products:all")

    return this.enrichProductWithDiscount(updatedProduct)
  }

  async toggleFeatured(id: number, isFeatured: boolean): Promise<Product> {
    const product = await this.findOne(id)
    product.isFeatured = isFeatured
    const updatedProduct = await this.productsRepository.save(product)

    await this.cacheManager.del(`products:${id}`)
    await this.cacheManager.del(`products:slug:${product.slug}`)
    await this.cacheManager.del("products:all")

    return this.enrichProductWithDiscount(updatedProduct)
  }

  async setDiscount(id: number, discountPercentage: number): Promise<Product> {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new BadRequestException("Discount percentage must be between 0 and 100")
    }

    const product = await this.findOne(id)
    product.discountPercentage = discountPercentage

    // Calculate discounted price
    if (discountPercentage > 0) {
      product.discountedPrice = Number(product.price) * (1 - discountPercentage / 100)
    } else {
      product.discountedPrice = undefined
    }

    const updatedProduct = await this.productsRepository.save(product)

    await this.cacheManager.del(`products:${id}`)
    await this.cacheManager.del(`products:slug:${product.slug}`)
    await this.cacheManager.del("products:all")

    return this.enrichProductWithDiscount(updatedProduct)
  }

  async setStockStatus(id: number, stockStatus: ProductStockStatus): Promise<Product> {
    const product = await this.findOne(id)
    product.stockStatus = stockStatus

    const updatedProduct = await this.productsRepository.save(product)

    await this.cacheManager.del(`products:${id}`)
    await this.cacheManager.del(`products:slug:${product.slug}`)
    await this.cacheManager.del("products:all")

    return this.enrichProductWithDiscount(updatedProduct)
  }

  async addProductImages(productId: number, fileIds: number[]): Promise<ProductImage[]> {
    const product = await this.findOne(productId)

    // Get the current max order for this product's images
    const maxOrderResult = await this.productImagesRepository
      .createQueryBuilder("pi")
      .select("MAX(pi.order)", "maxOrder")
      .where("pi.productId = :productId", { productId })
      .getRawOne()

    const startOrder = (maxOrderResult?.maxOrder || -1) + 1

    // Create ProductImage records
    const productImages: ProductImage[] = []
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i]

      // Check if this image is already associated with this product
      const existing = await this.productImagesRepository.findOne({
        where: { productId, fileId },
      })

      if (!existing) {
        const productImage = this.productImagesRepository.create({
          productId,
          fileId,
          order: startOrder + i,
          isPrimary: false,
        })
        const saved = await this.productImagesRepository.save(productImage)
        productImages.push(saved)
      }
    }

    // If product has no cover image, set the first uploaded image as cover
    if (!product.coverImageId && productImages.length > 0) {
      product.coverImageId = productImages[0].fileId
      productImages[0].isPrimary = true
      await this.productsRepository.save(product)
      await this.productImagesRepository.save(productImages[0])
    }

    await this.cacheManager.del(`products:${productId}`)
    await this.cacheManager.del(`products:slug:${product.slug}`)
    await this.cacheManager.del("products:all")

    return productImages
  }

  async setCoverImage(productId: number, fileId: number): Promise<Product> {
    const product = await this.findOne(productId)

    // Verify that the file is associated with this product
    const productImage = await this.productImagesRepository.findOne({
      where: { productId, fileId },
    })

    if (!productImage) {
      throw new NotFoundException(`Image with ID ${fileId} not found for product ${productId}`)
    }

    // Update old primary image
    if (product.coverImageId) {
      const oldPrimaryImage = await this.productImagesRepository.findOne({
        where: { productId, fileId: product.coverImageId },
      })
      if (oldPrimaryImage) {
        oldPrimaryImage.isPrimary = false
        await this.productImagesRepository.save(oldPrimaryImage)
      }
    }

    // Set new cover image
    product.coverImageId = fileId
    productImage.isPrimary = true
    await this.productImagesRepository.save(productImage)
    const updatedProduct = await this.productsRepository.save(product)

    await this.cacheManager.del(`products:${productId}`)
    await this.cacheManager.del(`products:slug:${product.slug}`)
    await this.cacheManager.del("products:all")

    return updatedProduct
  }

  async deleteProductImage(productId: number, productImageId: number): Promise<void> {
    const product = await this.findOne(productId)

    const productImage = await this.productImagesRepository.findOne({
      where: { id: productImageId, productId },
    })

    if (!productImage) {
      throw new NotFoundException(
        `Product image with ID ${productImageId} not found for product ${productId}`,
      )
    }

    // If this is the cover image, unset it
    if (product.coverImageId === productImage.fileId) {
      product.coverImageId = null
      await this.productsRepository.save(product)
    }

    // Delete the ProductImage record (file management is handled separately)
    await this.productImagesRepository.remove(productImage)

    await this.cacheManager.del(`products:${productId}`)
    await this.cacheManager.del(`products:slug:${product.slug}`)
    await this.cacheManager.del("products:all")
  }
}
