/**
 * Products API Service
 * Handles fetching product data from the backend API
 */

import { apiClient } from "./api-client"
import type { Product } from "./types"
import { getCurrencyByCode } from "./currencies"

export enum SortBy {
  PRICE_LOW = "price-low",
  PRICE_HIGH = "price-high",
  NAME_ASC = "name-asc",
  NAME_DESC = "name-desc",
  NEWEST = "newest",
  OLDEST = "oldest",
}

// Valid product categories (must match backend enum exactly)
const VALID_CATEGORIES = [
  "Bags",
  "Books",
  "Electronics",
  "Clothing",
  "Accessories",
  "Home",
  "Sports",
  "Toys",
] as const

/**
 * Normalize category name to match backend enum (case-insensitive)
 * @param category - Category string from URL or user input
 * @returns Normalized category name or null if invalid
 */
export function normalizeCategory(category: string): string | null {
  const normalized = VALID_CATEGORIES.find(
    (validCat) => validCat.toLowerCase() === category.toLowerCase().trim(),
  )
  return normalized || null
}

/**
 * Normalize multiple categories
 * @param categories - Array of category strings
 * @returns Array of normalized categories (invalid ones filtered out)
 */
export function normalizeCategories(categories: string[]): string[] {
  return categories.map(normalizeCategory).filter((cat): cat is string => cat !== null)
}

interface ApiProduct {
  id: number
  slug: string
  name: string
  summary?: string
  description: string
  price: string
  currency: string
  country: string
  vatPercentage: string
  stockQuantity: number
  stockStatus: string
  category: string
  type: string
  coverImageId: number
  isActive: boolean
  isFeatured: boolean
  discountPercentage: string
  discount: number
  discountedPrice: number
  createdAt: string
  updatedAt: string
  coverImage?: {
    id: number
    key: string
    url: string
    urlThumbnail?: string
    urlMedium?: string
    urlLarge?: string
    originalName: string
    title?: string
    description?: string
    mimeType: string
    size: number
  }
  images?: Array<{
    id: number
    fileId: number
    order: number
    isPrimary: boolean
    file: {
      id: number
      key: string
      url: string
      urlThumbnail?: string
      urlMedium?: string
      urlLarge?: string
      originalName: string
      title?: string
      description?: string
      mimeType: string
      size: number
    }
  }>
}

interface ProductsApiResponse {
  products: ApiProduct[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface SingleProductApiResponse {
  product: ApiProduct
}

/**
 * Transform API product to frontend Product type
 */
function transformProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    name: apiProduct.name,
    summary: apiProduct.summary,
    description: apiProduct.description,
    price: parseFloat(apiProduct.price),
    currency: apiProduct.currency,
    country: apiProduct.country,
    vatPercentage: parseFloat(apiProduct.vatPercentage),
    discountPercentage: parseFloat(apiProduct.discountPercentage),
    discount: apiProduct.discount,
    discountedPrice: parseFloat(apiProduct.discountPercentage),
    stockQuantity: apiProduct.stockQuantity,
    stockStatus: apiProduct.stockStatus,
    category: apiProduct.category,
    type: apiProduct.type,
    isFeatured: apiProduct.isFeatured,
    isActive: apiProduct.isActive,
    isNew: false, // Can be determined by createdAt if needed
    image: apiProduct.coverImage?.url || "",
    coverImage: apiProduct.coverImage,
    images: apiProduct.images?.map((img) => ({
      id: img.file.id,
      url: img.file.url,
      urlThumbnail: img.file.urlThumbnail,
      urlMedium: img.file.urlMedium,
      urlLarge: img.file.urlLarge,
      originalName: img.file.originalName,
      title: img.file.title,
      order: img.order,
      isPrimary: img.isPrimary,
    })),
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
  }
}

/**
 * Unified interface for querying products
 * Supports all filtering, search, and sorting options
 */
export interface ProductsQueryParams {
  // Pagination
  page?: number
  limit?: number

  // Search
  query?: string

  // Category/Type filters (arrays for consistency)
  categories?: string[]
  types?: string[]

  // Feature filters
  featured?: boolean
  newArrival?: boolean
  outOfStock?: boolean

  // Price filters
  minPrice?: number
  maxPrice?: number

  // Sorting
  sortBy?: SortBy
}

/**
 * Unified method to fetch products with comprehensive filtering and search
 * Uses the /products endpoint which now supports all query parameters
 *
 * @param params - Query parameters for filtering, searching, and sorting
 * @returns Products and pagination information
 *
 * @example
 * ```typescript
 * // Simple listing
 * const { products } = await fetchProducts({ limit: 10 })
 *
 * // Search with filters
 * const { products } = await fetchProducts({
 *   query: 'laptop',
 *   categories: ['Electronics'],
 *   minPrice: 500,
 *   maxPrice: 2000,
 *   sortBy: SortBy.PRICE_LOW
 * })
 *
 * // Featured products
 * const { products } = await fetchProducts({ featured: true, limit: 8 })
 * ```
 */
export async function fetchProducts(params?: ProductsQueryParams): Promise<{
  products: Product[]
  pagination: any
}> {
  try {
    const queryParams = new URLSearchParams()

    // Pagination
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())

    // Search
    if (params?.query) queryParams.append("query", params.query)

    // Categories (always send as array)
    if (params?.categories && params.categories.length > 0) {
      params.categories.forEach((cat) => queryParams.append("categories", cat))
    }

    // Types (always send as array)
    if (params?.types && params.types.length > 0) {
      params.types.forEach((type) => queryParams.append("types", type))
    }

    // Feature filters
    if (params?.featured !== undefined) {
      queryParams.append("featured", params.featured.toString())
    }
    if (params?.newArrival !== undefined) {
      queryParams.append("newArrival", params.newArrival.toString())
    }
    if (params?.outOfStock !== undefined) {
      queryParams.append("outOfStock", params.outOfStock.toString())
    }

    // Price filters
    if (params?.minPrice !== undefined) {
      queryParams.append("minPrice", params.minPrice.toString())
    }
    if (params?.maxPrice !== undefined) {
      queryParams.append("maxPrice", params.maxPrice.toString())
    }

    // Sorting
    if (params?.sortBy) {
      queryParams.append("sortBy", params.sortBy)
    }

    const query = queryParams.toString()
    const endpoint = `/api/v1/products${query ? `?${query}` : ""}`

    const data = await apiClient.get<ProductsApiResponse>(endpoint, {
      cache: "no-store",
      next: {
        revalidate: 0, // Disable caching
      },
    })

    return {
      products: data.products.map(transformProduct),
      pagination: data.pagination,
    }
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return { products: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }
  }
}

/**
 * @deprecated Use fetchProducts() instead with the same parameters
 * Maintained for backward compatibility
 */
export async function searchProducts(params?: ProductsQueryParams): Promise<{
  products: Product[]
  pagination: any
}> {
  console.warn("searchProducts() is deprecated. Use fetchProducts() instead.")
  return fetchProducts(params)
}

/**
 * Fetch a single product by slug
 */
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const data = await apiClient.get<SingleProductApiResponse>(`/api/v1/products/${slug}`)
    return transformProduct(data.product)
  } catch (error) {
    console.error(`Failed to fetch product ${slug}:`, error)
    return null
  }
}

/**
 * Fetch featured products
 */
export async function fetchFeaturedProducts(limit: number = 8): Promise<Product[]> {
  try {
    const { products } = await fetchProducts({ featured: true, limit })
    return products
  } catch (error) {
    console.error("Failed to fetch featured products:", error)
    return []
  }
}

/**
 * Fetch new arrival products
 */
export async function fetchNewArrivals(limit: number = 8): Promise<Product[]> {
  try {
    const { products } = await fetchProducts({ newArrival: true, limit })
    return products
  } catch (error) {
    console.error("Failed to fetch new arrivals:", error)
    return []
  }
}

/**
 * Fetch products by category
 */
export async function fetchProductsByCategory(
  category: string,
  limit: number = 100,
): Promise<Product[]> {
  try {
    const { products } = await fetchProducts({ categories: [category], limit })
    return products
  } catch (error) {
    console.error(`Failed to fetch products for category ${category}:`, error)
    return []
  }
}

/**
 * Fetch a single product by ID
 */
export async function fetchProductById(id: number): Promise<Product | null> {
  try {
    const data = await apiClient.get<SingleProductApiResponse>(`/api/v1/products/${id}`)
    return transformProduct(data.product)
  } catch (error) {
    console.error(`Failed to fetch product ${id}:`, error)
    return null
  }
}

/**
 * Validate stock availability for cart items
 * Returns items that are not available for purchase
 */
export async function validateCartStock(cartItems: Array<{ id: number; quantity: number }>) {
  const unavailableItems: Array<{
    id: number
    reason: string
    currentStock: number
    requestedQuantity: number
  }> = []

  // Fetch current product details for all items
  const productPromises = cartItems.map((item) => fetchProductById(item.id))
  const products = await Promise.all(productPromises)

  products.forEach((product, index) => {
    if (!product) {
      unavailableItems.push({
        id: cartItems[index].id,
        reason: "Product not found",
        currentStock: 0,
        requestedQuantity: cartItems[index].quantity,
      })
      return
    }

    const requestedQuantity = cartItems[index].quantity

    // Check stock status
    if (product.stockStatus === "OUT_OF_STOCK" || product.stockStatus === "DISCONTINUED") {
      unavailableItems.push({
        id: product.id,
        reason: `Product is ${product.stockStatus === "DISCONTINUED" ? "discontinued" : "out of stock"}`,
        currentStock: product.stockQuantity,
        requestedQuantity,
      })
      return
    }

    // Check if enough stock is available
    if (product.stockQuantity < requestedQuantity) {
      unavailableItems.push({
        id: product.id,
        reason: "Insufficient stock",
        currentStock: product.stockQuantity,
        requestedQuantity,
      })
      return
    }

    // Check if product is active
    if (!product.isActive) {
      unavailableItems.push({
        id: product.id,
        reason: "Product is no longer available",
        currentStock: product.stockQuantity,
        requestedQuantity,
      })
    }
  })

  return {
    isValid: unavailableItems.length === 0,
    unavailableItems,
  }
}

/**
 * Get image URL with appropriate size
 * Automatically selects the best size based on the use case
 */
export function getProductImageUrl(
  product: Product,
  size: "thumbnail" | "medium" | "large" | "original" = "original",
): string {
  const coverImage = product.coverImage

  if (!coverImage) {
    return product.image
  }

  switch (size) {
    case "thumbnail":
      return coverImage.urlThumbnail || coverImage.url
    case "medium":
      return coverImage.urlMedium || coverImage.url
    case "large":
      return coverImage.urlLarge || coverImage.url
    case "original":
    default:
      return coverImage.url
  }
}
