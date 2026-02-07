/**
 * Shipping Addresses API client
 * Handles user shipping address management
 */

import { apiClient } from './api-client'

export interface ShippingAddress {
  id: number
  userId: number
  recipientName: string
  recipientPhone?: string
  address: string
  city: string
  state?: string
  zipCode?: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateShippingAddressDto {
  recipientName: string
  recipientPhone?: string
  address: string
  city: string
  state?: string
  zipCode?: string
  country: string
  isDefault?: boolean
}

export interface UpdateShippingAddressDto {
  recipientName?: string
  recipientPhone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  isDefault?: boolean
}

export const shippingAddressesApi = {
  /**
   * Get all shipping addresses for current user
   */
  async getAll(): Promise<{ addresses: ShippingAddress[] }> {
    return apiClient.get<{ addresses: ShippingAddress[] }>('/api/v1/auth/shipping-addresses')
  },

  /**
   * Get default shipping address for current user
   */
  async getDefault(): Promise<{ address: ShippingAddress | null }> {
    return apiClient.get<{ address: ShippingAddress | null }>('/api/v1/auth/shipping-addresses/default')
  },

  /**
   * Get a specific shipping address by ID
   */
  async getById(id: number): Promise<{ address: ShippingAddress }> {
    return apiClient.get<{ address: ShippingAddress }>(`/api/v1/auth/shipping-addresses/${id}`)
  },

  /**
   * Create a new shipping address
   */
  async create(data: CreateShippingAddressDto): Promise<{ address: ShippingAddress; message: string }> {
    return apiClient.post<{ address: ShippingAddress; message: string }>(
      '/api/v1/auth/shipping-addresses',
      data,
    )
  },

  /**
   * Update a shipping address
   */
  async update(
    id: number,
    data: UpdateShippingAddressDto,
  ): Promise<{ address: ShippingAddress; message: string }> {
    return apiClient.patch<{ address: ShippingAddress; message: string }>(
      `/api/v1/auth/shipping-addresses/${id}`,
      data,
    )
  },

  /**
   * Set a shipping address as default
   */
  async setAsDefault(id: number): Promise<{ address: ShippingAddress; message: string }> {
    return apiClient.patch<{ address: ShippingAddress; message: string }>(
      `/api/v1/auth/shipping-addresses/${id}/set-default`,
      {},
    )
  },

  /**
   * Delete a shipping address
   */
  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/v1/auth/shipping-addresses/${id}`)
  },
}
