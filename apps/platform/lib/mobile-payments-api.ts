/**
 * Mobile Payments API client
 * Handles user mobile payment methods management
 */

import { apiClient } from './api-client'

export interface MobilePayment {
  id: number
  userId: number
  providerName: string
  phoneNumber: string
  label?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateMobilePaymentDto {
  providerName: string
  phoneNumber: string
  label?: string
  isDefault?: boolean
}

export interface UpdateMobilePaymentDto {
  providerName?: string
  phoneNumber?: string
  label?: string
  isDefault?: boolean
}

export const mobilePaymentsApi = {
  /**
   * Get all mobile payment methods for current user
   */
  async getAll(): Promise<MobilePayment[]> {
    return apiClient.get<MobilePayment[]>('/api/v1/auth/mobile-payments')
  },

  /**
   * Get a specific mobile payment method by ID
   */
  async getById(id: number): Promise<MobilePayment> {
    return apiClient.get<MobilePayment>(`/api/v1/auth/mobile-payments/${id}`)
  },

  /**
   * Create a new mobile payment method
   */
  async create(data: CreateMobilePaymentDto): Promise<MobilePayment> {
    return apiClient.post<MobilePayment>('/api/v1/auth/mobile-payments', data)
  },

  /**
   * Update a mobile payment method
   */
  async update(id: number, data: UpdateMobilePaymentDto): Promise<MobilePayment> {
    return apiClient.patch<MobilePayment>(`/api/v1/auth/mobile-payments/${id}`, data)
  },

  /**
   * Set a mobile payment method as default
   */
  async setAsDefault(id: number): Promise<MobilePayment> {
    return apiClient.patch<MobilePayment>(`/api/v1/auth/mobile-payments/${id}/set-default`, {})
  },

  /**
   * Delete a mobile payment method
   */
  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/v1/auth/mobile-payments/${id}`)
  },
}
