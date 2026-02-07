import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { CACHE_MANAGER } from "@nestjs/cache-manager"
import { NotFoundException } from "@nestjs/common"
import { Repository } from "typeorm"
import { ProductsService } from "./products.service"
import { Product } from "./entities/product.entity"
import { ProductImage } from "./entities/product-image.entity"
import { File } from "../../common/entities/file.entity"
import { CreateProductDto } from "./dto/create-product.dto"
import { ProductCategory, ProductType } from "./enums/product-category.enum"
import { ProductStockStatus } from "./enums/product-status.enum"
import { Currency } from "./enums/currency.enum"
import { Country } from "./enums/country.enum"

describe("ProductsService", () => {
  let service: ProductsService
  let _repository: Repository<Product>
  let _productImageRepository: Repository<ProductImage>
  let _cacheManager: any

  const mockFile: File = {
    id: 1,
    key: "products/test-image.jpg",
    url: "https://example.com/test-image.jpg",
    urlThumbnail: "https://example.com/test-image-thumb.jpg",
    urlMedium: "https://example.com/test-image-medium.jpg",
    urlLarge: "https://example.com/test-image-large.jpg",
    originalName: "test-image.jpg",
    title: "Test Product - Cover Image",
    description: null,
    mimeType: "image/jpeg",
    size: 1024,
    folder: "products",
    uploadedBy: null,
    entityType: "product",
    entityId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockProductImage: ProductImage = {
    id: 1,
    productId: 1,
    product: null,
    fileId: 1,
    file: mockFile,
    order: 0,
    isPrimary: true,
    createdAt: new Date(),
  }

  const mockProduct: Product = {
    id: 1,
    slug: "test-product",
    name: "Test Product",
    summary: "Test Summary",
    description: "Test Description",
    price: 99.99,
    vatPercentage: 18,
    currency: Currency.USD,
    country: Country.UNITED_STATES,
    stockQuantity: 10,
    category: ProductCategory.ELECTRONICS,
    type: ProductType.LAPTOP,
    coverImageId: 1,
    coverImage: mockFile,
    images: [mockProductImage],
    reviews: [],
    stockStatus: ProductStockStatus.IN_STOCK,
    discountPercentage: 0,
    searchVector: "",
    shippingRatePerKm: 0,
    weightInKg: 0,
    isActive: true,
    isFeatured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
  }

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  }

  const mockProductImageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  }

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(ProductImage),
          useValue: mockProductImageRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile()

    service = module.get<ProductsService>(ProductsService)
    _repository = module.get<Repository<Product>>(getRepositoryToken(Product))
    _productImageRepository = module.get<Repository<ProductImage>>(getRepositoryToken(ProductImage))
    _cacheManager = module.get(CACHE_MANAGER)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("create", () => {
    it("should create a product", async () => {
      const createProductDto: CreateProductDto = {
        name: "Test Product",
        description: "Test Description",
        price: 99.99,
        vatPercentage: 18,
        currency: Currency.USD,
        country: Country.UNITED_STATES,
        stockQuantity: 10,
        category: ProductCategory.ELECTRONICS,
        type: ProductType.LAPTOP,
      }

      mockRepository.create.mockReturnValue(mockProduct)
      mockRepository.save.mockResolvedValue(mockProduct)
      mockCacheManager.del.mockResolvedValue(undefined)

      const result = await service.create(createProductDto)

      expect(result).toEqual(mockProduct)
      expect(mockRepository.create).toHaveBeenCalledWith(createProductDto)
      expect(mockRepository.save).toHaveBeenCalled()
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:all")
    })
  })

  describe("findAll", () => {
    it("should return products with pagination from cache", async () => {
      const expectedResult = {
        products: [mockProduct],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }
      mockCacheManager.get.mockResolvedValue(expectedResult)

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result).toEqual(expectedResult)
      expect(mockCacheManager.get).toHaveBeenCalledWith("products:all:1:10:activeOnly")
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled()
    })

    it("should return products with pagination from database when cache misses", async () => {
      const products = [mockProduct]
      mockCacheManager.get.mockResolvedValue(null)
      mockQueryBuilder.getCount.mockResolvedValue(1)
      mockQueryBuilder.getMany.mockResolvedValue(products)
      mockCacheManager.set.mockResolvedValue(undefined)

      const result = await service.findAll({ page: 1, limit: 10 })

      expect(result.products).toEqual(products)
      expect(result.pagination).toBeDefined()
      expect(result.pagination.total).toBe(1)
      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith("product")
      expect(mockQueryBuilder.where).toHaveBeenCalledWith("product.isActive = :isActive", {
        isActive: true,
      })
      expect(mockCacheManager.set).toHaveBeenCalledWith("products:all:1:10:activeOnly", result, 600)
    })
  })

  describe("findOne", () => {
    it("should return a product by id from cache", async () => {
      mockCacheManager.get.mockResolvedValue(mockProduct)

      const result = await service.findOne(1)

      expect(result).toEqual(mockProduct)
      expect(mockCacheManager.get).toHaveBeenCalledWith("products:1")
      expect(mockRepository.findOne).not.toHaveBeenCalled()
    })

    it("should return a product by id from database when cache misses", async () => {
      mockCacheManager.get.mockResolvedValue(null)
      mockRepository.findOne.mockResolvedValue(mockProduct)
      mockCacheManager.set.mockResolvedValue(undefined)

      const result = await service.findOne(1)

      expect(result).toEqual(mockProduct)
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ["images", "images.file"],
      })
      expect(mockCacheManager.set).toHaveBeenCalledWith("products:1", mockProduct, 600)
    })

    it("should throw NotFoundException when product not found", async () => {
      mockCacheManager.get.mockResolvedValue(null)
      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException)
    })
  })

  describe("update", () => {
    it("should update a product", async () => {
      const updateDto = { name: "Updated Product" }
      const updatedProduct = { ...mockProduct, ...updateDto }

      mockCacheManager.get.mockResolvedValue(mockProduct)
      mockRepository.save.mockResolvedValue(updatedProduct)
      mockCacheManager.del.mockResolvedValue(undefined)

      const result = await service.update(1, updateDto)

      expect(result).toEqual(updatedProduct)
      expect(mockRepository.save).toHaveBeenCalled()
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:1")
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:all")
    })
  })

  describe("remove", () => {
    it("should remove a product", async () => {
      mockCacheManager.get.mockResolvedValue(mockProduct)
      mockRepository.remove.mockResolvedValue(mockProduct)
      mockCacheManager.del.mockResolvedValue(undefined)

      await service.remove(1)

      expect(mockRepository.remove).toHaveBeenCalledWith(mockProduct)
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:1")
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:all")
    })
  })

  describe("addProductImages", () => {
    it("should add images to a product by file IDs", async () => {
      const fileIds = [2, 3]
      const productWithCover = { ...mockProduct, coverImageId: 1 }

      mockCacheManager.get.mockResolvedValue(productWithCover)
      mockRepository.findOne.mockResolvedValue(productWithCover)
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxOrder: 0 })
      mockProductImageRepository.findOne.mockResolvedValue(null)
      mockProductImageRepository.create.mockImplementation((data) => data as any)
      mockProductImageRepository.save.mockImplementation((image) =>
        Promise.resolve({ ...image, id: 2 }),
      )
      mockCacheManager.del.mockResolvedValue(undefined)

      const result = await service.addProductImages(1, fileIds)

      expect(result).toHaveLength(2)
      expect(mockProductImageRepository.create).toHaveBeenCalledTimes(2)
      expect(mockProductImageRepository.save).toHaveBeenCalledTimes(2)
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:1")
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:slug:test-product")
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:all")
    })

    it("should set first image as cover if no cover exists", async () => {
      const fileIds = [2]
      const productWithoutCover = { ...mockProduct, coverImageId: null }

      mockCacheManager.get.mockResolvedValue(productWithoutCover)
      mockRepository.findOne.mockResolvedValue(productWithoutCover)
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxOrder: -1 })
      mockProductImageRepository.findOne.mockResolvedValue(null)
      mockProductImageRepository.create.mockImplementation((data) => data as any)
      mockProductImageRepository.save.mockImplementation((image) =>
        Promise.resolve({ ...image, id: 2 }),
      )
      mockRepository.save.mockResolvedValue({ ...productWithoutCover, coverImageId: 2 })
      mockCacheManager.del.mockResolvedValue(undefined)

      await service.addProductImages(1, fileIds)

      expect(mockRepository.save).toHaveBeenCalledWith(expect.objectContaining({ coverImageId: 2 }))
      expect(mockProductImageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isPrimary: true }),
      )
    })

    it("should skip already associated images", async () => {
      const fileIds = [2, 3]
      const existingImage = { id: 1, productId: 1, fileId: 2 }

      mockCacheManager.get.mockResolvedValue(mockProduct)
      mockRepository.findOne.mockResolvedValue(mockProduct)
      mockQueryBuilder.getRawOne.mockResolvedValue({ maxOrder: 0 })
      mockProductImageRepository.findOne
        .mockResolvedValueOnce(existingImage) // First call finds existing
        .mockResolvedValueOnce(null) // Second call finds nothing
      mockProductImageRepository.create.mockImplementation((data) => data as any)
      mockProductImageRepository.save.mockImplementation((image) =>
        Promise.resolve({ ...image, id: 3 }),
      )
      mockCacheManager.del.mockResolvedValue(undefined)

      const result = await service.addProductImages(1, fileIds)

      expect(result).toHaveLength(1) // Only one new image added
      expect(mockProductImageRepository.save).toHaveBeenCalledTimes(1)
    })
  })

  describe("setCoverImage", () => {
    it("should set a product's cover image", async () => {
      const newFileId = 2
      const newProductImage = { ...mockProductImage, id: 2, fileId: newFileId, isPrimary: false }
      const oldProductImage = { ...mockProductImage, isPrimary: true }

      mockCacheManager.get.mockResolvedValue(mockProduct)
      mockRepository.findOne.mockResolvedValue(mockProduct)
      mockProductImageRepository.findOne
        .mockResolvedValueOnce(newProductImage) // Find new image
        .mockResolvedValueOnce(oldProductImage) // Find old primary image
      mockProductImageRepository.save.mockResolvedValue(newProductImage)
      mockRepository.save.mockResolvedValue({ ...mockProduct, coverImageId: newFileId })
      mockCacheManager.del.mockResolvedValue(undefined)

      const result = await service.setCoverImage(1, newFileId)

      expect(result.coverImageId).toBe(newFileId)
      expect(mockProductImageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ isPrimary: false }),
      )
      expect(mockProductImageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ fileId: newFileId, isPrimary: true }),
      )
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:1")
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:slug:test-product")
    })

    it("should throw NotFoundException if image not associated with product", async () => {
      mockCacheManager.get.mockResolvedValue(mockProduct)
      mockRepository.findOne.mockResolvedValue(mockProduct)
      mockProductImageRepository.findOne.mockResolvedValue(null)

      await expect(service.setCoverImage(1, 999)).rejects.toThrow(NotFoundException)
    })
  })

  describe("deleteProductImage", () => {
    it("should delete a product image", async () => {
      const imageToDelete = { ...mockProductImage, id: 2, fileId: 2 }
      const productWithDifferentCover = { ...mockProduct, coverImageId: 1 }

      mockCacheManager.get.mockResolvedValue(productWithDifferentCover)
      mockRepository.findOne.mockResolvedValue(productWithDifferentCover)
      mockProductImageRepository.findOne.mockResolvedValue(imageToDelete)
      mockProductImageRepository.remove.mockResolvedValue(imageToDelete)
      mockCacheManager.del.mockResolvedValue(undefined)

      await service.deleteProductImage(1, 2)

      expect(mockProductImageRepository.remove).toHaveBeenCalledWith(imageToDelete)
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:1")
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:slug:test-product")
      expect(mockCacheManager.del).toHaveBeenCalledWith("products:all")
    })

    it("should unset coverImageId if deleting cover image", async () => {
      // ProductImage with id=1, fileId=1 (matches mockProduct.coverImageId=1)
      const coverImage = { ...mockProductImage, id: 1, fileId: 1 }
      const productWithCover = { ...mockProduct, coverImageId: 1 }

      mockCacheManager.get.mockResolvedValue(null) // Force database query
      mockRepository.findOne.mockResolvedValue(productWithCover)
      mockProductImageRepository.findOne.mockResolvedValue(coverImage)
      mockRepository.save.mockResolvedValue({ ...productWithCover, coverImageId: null })
      mockProductImageRepository.remove.mockResolvedValue(coverImage)
      mockCacheManager.set.mockResolvedValue(undefined)
      mockCacheManager.del.mockResolvedValue(undefined)

      await service.deleteProductImage(1, 1) // productId=1, productImageId=1

      expect(mockRepository.save).toHaveBeenCalled()
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ coverImageId: null }),
      )
      expect(mockProductImageRepository.remove).toHaveBeenCalledWith(coverImage)
    })

    it("should throw NotFoundException when image not found", async () => {
      mockCacheManager.get.mockResolvedValue(mockProduct)
      mockRepository.findOne.mockResolvedValue(mockProduct)
      mockProductImageRepository.findOne.mockResolvedValue(null)

      await expect(service.deleteProductImage(1, 999)).rejects.toThrow(NotFoundException)
    })
  })
})
