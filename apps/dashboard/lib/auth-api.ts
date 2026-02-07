/**
 * Authentication API service for admin dashboard
 * Handles all auth-related API calls to the backend
 */

import { apiClient } from './api-client'

export interface AdminUser {
  id: string
  email: string
  name: string
  roles: string[]
  provider: string
  picture?: string
}

export interface AuthResponse {
  user: AdminUser
  accessToken: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface ForgotPasswordDto {
  email: string
}

export interface ResetPasswordDto {
  token: string
  newPassword: string
}

export const authApi = {
  /**
   * Login with email and password (Admin or Seller only)
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', data)

    // Verify user has admin or seller role
    if (!response.user.roles.includes('admin') && !response.user.roles.includes('seller')) {
      throw new Error('Access denied. Admin or seller privileges required.')
    }

    return response
  },

  /**
   * Get current admin/seller profile
   */
  async getProfile(token: string): Promise<{ user: AdminUser }> {
    const response = await apiClient.get<{ user: AdminUser }>('/api/v1/auth/profile', { token })

    // Verify user has admin or seller role
    if (!response.user.roles.includes('admin') && !response.user.roles.includes('seller')) {
      throw new Error('Access denied. Admin or seller privileges required.')
    }

    return response
  },

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<{ message: string; resetToken?: string }> {
    return apiClient.post<{ message: string; resetToken?: string }>('/api/v1/auth/forgot-password', data)
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordDto): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/v1/auth/reset-password', data)
  },
}
