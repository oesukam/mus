/**
 * Vendors API client
 * Handles vendor management operations for admin dashboard
 */

import { apiClient } from './api-client'

export interface Vendor {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  country?: string
  description?: string
  contactPerson?: string
  taxId?: string
  website?: string
  notes?: string
  isActive: boolean
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

export interface VendorsResponse {
  vendors: Vendor[]
  pagination: PaginationMeta
}

export interface CreateVendorDto {
  name: string
  email?: string
  phone?: string
  address?: string
  country?: string
  description?: string
  contactPerson?: string
  taxId?: string
  website?: string
  notes?: string
  isActive?: boolean
}

export interface UpdateVendorDto {
  name?: string
  email?: string
  phone?: string
  address?: string
  country?: string
  description?: string
  contactPerson?: string
  taxId?: string
  website?: string
  notes?: string
  isActive?: boolean
}

export const vendorsApi = {
  /**
   * Get all vendors with pagination and filtering
   */
  async getVendors(params?: {
    page?: number
    limit?: number
    search?: string
    country?: string
    isActive?: boolean
  }): Promise<VendorsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.country) queryParams.append('country', params.country)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())

    const url = `/api/v1/admin/vendors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<VendorsResponse>(url)
  },

  /**
   * Get all active vendors
   */
  async getActiveVendors(): Promise<{ vendors: Vendor[] }> {
    return apiClient.get<{ vendors: Vendor[] }>('/api/v1/admin/vendors/active')
  },

  /**
   * Get vendors by country
   */
  async getVendorsByCountry(country: string): Promise<{ vendors: Vendor[] }> {
    return apiClient.get<{ vendors: Vendor[] }>(`/api/v1/admin/vendors/country/${country}`)
  },

  /**
   * Get a single vendor by ID
   */
  async getVendor(id: number): Promise<{ vendor: Vendor }> {
    return apiClient.get<{ vendor: Vendor }>(`/api/v1/admin/vendors/${id}`)
  },

  /**
   * Create a new vendor
   */
  async createVendor(data: CreateVendorDto): Promise<{ vendor: Vendor }> {
    return apiClient.post<{ vendor: Vendor }>('/api/v1/admin/vendors', data)
  },

  /**
   * Update a vendor
   */
  async updateVendor(id: number, data: UpdateVendorDto): Promise<{ vendor: Vendor }> {
    return apiClient.put<{ vendor: Vendor }>(`/api/v1/admin/vendors/${id}`, data)
  },

  /**
   * Toggle vendor active status
   */
  async toggleVendorStatus(id: number): Promise<{ vendor: Vendor }> {
    return apiClient.patch<{ vendor: Vendor }>(`/api/v1/admin/vendors/${id}/toggle-status`, {})
  },

  /**
   * Delete a vendor
   */
  async deleteVendor(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/v1/admin/vendors/${id}`)
  },
}
