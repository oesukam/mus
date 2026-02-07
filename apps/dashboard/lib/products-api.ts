/**
 * Products API client
 * Handles product management operations for admin dashboard
 */

import { apiClient } from './api-client'

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price: number
  vatPercentage: number
  shippingRatePerKm?: number
  weightInKg?: number
  currency: string
  country: string
  stockQuantity: number
  stockStatus: string
  category: string
  type: string
  brand?: string
  sku?: string
  weight?: number
  dimensions?: string
  images?: string[]
  tags?: string[]
  isFeatured: boolean
  isActive: boolean
  discountPercentage: number
  averageRating?: number
  totalReviews?: number
  coverImageId?: number
  coverImage?: {
    id: number
    url: string
    urlThumbnail?: string
    urlMedium?: string
    urlLarge?: string
    mimeType?: string
  }
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ProductsResponse {
  products: Product[]
  pagination: PaginationMeta
}

export interface CreateProductDto {
  name: string
  description: string
  price: number
  vatPercentage?: number
  shippingRatePerKm?: number
  weightInKg?: number
  currency?: string
  country: string
  stockQuantity: number
  stockStatus?: string
  category: string
  type: string
  brand?: string
  sku?: string
  weight?: number
  dimensions?: string
  images?: string[]
  tags?: string[]
  isFeatured?: boolean
  isActive?: boolean
  coverImageId?: number
}

export interface UpdateProductDto {
  name?: string
  slug?: string
  description?: string
  price?: number
  vatPercentage?: number
  shippingRatePerKm?: number
  weightInKg?: number
  currency?: string
  country?: string
  stockQuantity?: number
  category?: string
  type?: string
  coverImageId?: number
  isActive?: boolean
  isFeatured?: boolean
}

export interface ProductBasic {
  id: number
  name: string
  price: number
  vatPercentage: number
  currency: string
  country: string
  stockQuantity: number
  category: string
  type: string
  isActive: boolean
}

export interface ProductSearchBasicResponse {
  products: ProductBasic[]
  total: number
  limit: number
}

export const productsApi = {
  /**
   * Search products with basic information (for select components)
   */
  async searchProducts(params?: {
    q?: string
    limit?: number
    isActive?: boolean
  }): Promise<ProductSearchBasicResponse> {
    const queryParams = new URLSearchParams()
    if (params?.q) queryParams.append('q', params.q)
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())

    const url = `/api/v1/admin/products/search/basic${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<ProductSearchBasicResponse>(url)
  },

  /**
   * Get all products with pagination and filtering
   */
  async getProducts(params?: {
    page?: number
    limit?: number
    isActive?: boolean
    featured?: boolean
    q?: string
    categories?: string
    types?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: string
    sortOrder?: string
  }): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString())
    if (params?.q) queryParams.append('q', params.q)
    if (params?.categories) queryParams.append('categories', params.categories)
    if (params?.types) queryParams.append('types', params.types)
    if (params?.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString())
    if (params?.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString())
    if (params?.sortBy) queryParams.append('sortByField', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const url = `/api/v1/admin/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<ProductsResponse>(url)
  },

  /**
   * Search products with full details (deprecated - use getProducts with q parameter instead)
   */
  async searchProductsFull(params: {
    query: string
    page?: number
    limit?: number
    isActive?: boolean
  }): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams()
    queryParams.append('query', params.query)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())

    return apiClient.get<ProductsResponse>(`/api/v1/admin/products/search?${queryParams.toString()}`)
  },

  /**
   * Get a single product by slug
   */
  async getProduct(slug: string): Promise<{ product: Product }> {
    return apiClient.get<{ product: Product }>(`/api/v1/admin/products/${slug}`)
  },

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductDto): Promise<{ product: Product }> {
    return apiClient.post<{ product: Product }>('/api/v1/admin/products', data)
  },

  /**
   * Update a product
   */
  async updateProduct(id: number, data: UpdateProductDto): Promise<{ product: Product }> {
    return apiClient.patch<{ product: Product }>(`/api/v1/admin/products/${id}`, data)
  },

  /**
   * Add images to a product
   */
  async addProductImages(id: number, fileIds: number[]): Promise<{ images: any[]; message: string }> {
    return apiClient.post<{ images: any[]; message: string }>(`/api/v1/admin/products/${id}/images`, { fileIds })
  },

  /**
   * Delete a product
   */
  async deleteProduct(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/v1/admin/products/${id}`)
  },

  /**
   * Update product stock
   */
  async updateStock(id: number, stockQuantity: number): Promise<{ product: Product; message: string }> {
    return apiClient.patch<{ product: Product; message: string }>(
      `/api/v1/admin/products/${id}/stock`,
      { stockQuantity }
    )
  },

  /**
   * Toggle product featured status
   */
  async toggleFeatured(id: number, isFeatured: boolean): Promise<{ product: Product; message: string }> {
    return apiClient.patch<{ product: Product; message: string }>(
      `/api/v1/admin/products/${id}/featured`,
      { isFeatured }
    )
  },

  /**
   * Set product discount
   */
  async setDiscount(id: number, discountPercentage: number): Promise<{ product: Product; message: string }> {
    return apiClient.patch<{ product: Product; message: string }>(
      `/api/v1/admin/products/${id}/discount`,
      { discountPercentage }
    )
  },

  /**
   * Set product stock status
   */
  async setStockStatus(id: number, stockStatus: string): Promise<{ product: Product; message: string }> {
    return apiClient.patch<{ product: Product; message: string }>(
      `/api/v1/admin/products/${id}/stock-status`,
      { stockStatus }
    )
  },
}
