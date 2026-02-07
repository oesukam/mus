/**
 * Authentication API service
 * Handles all auth-related API calls to the backend
 */

import { apiClient } from './api-client'

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: string[]
  provider: string
  picture?: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export interface SignupDto {
  email: string
  password: string
  name: string
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
   * Sign up a new user
   */
  async signup(data: SignupDto): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/v1/auth/signup', data)
  },

  /**
   * Login with email and password
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/api/v1/auth/login', data)
  },

  /**
   * Get current user profile
   */
  async getProfile(token: string): Promise<{ user: AuthUser }> {
    return apiClient.get<{ user: AuthUser }>('/api/v1/auth/profile', { token })
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

  /**
   * Initiate Google OAuth login
   * Opens Google OAuth flow with origin URL as state parameter
   */
  googleLogin(): void {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const originUrl = window.location.origin // e.g., http://localhost:3000
    window.location.href = `${apiUrl}/api/v1/auth/google?state=${encodeURIComponent(originUrl)}`
  },
}
