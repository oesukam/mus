/**
 * Users API client
 * Handles user management operations for admin dashboard
 */

import { apiClient } from './api-client'

export interface Role {
  id: number
  name: string
  displayName: string
  description?: string
  permissions?: Permission[]
}

export interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description?: string
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export interface User {
  id: number
  email: string
  name: string
  provider: string
  googleId?: string
  picture?: string
  status: UserStatus
  roles: Role[]
  // Notification settings
  notificationsOrderUpdates: boolean
  notificationsPromotions: boolean
  notificationsWishlistAlerts: boolean
  notificationsNewsletter: boolean
  // Privacy settings
  privacyShowProfile: boolean
  privacyShareData: boolean
  // Preferences
  preferencesCurrency: string
  preferencesLanguage: string
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

export interface UsersResponse {
  users: User[]
  pagination: PaginationMeta
}

export interface UserResponse {
  user: User
}

export interface UserWithMessageResponse {
  message: string
  user: User
}

export interface AssignRolesDto {
  roleIds: number[]
}

export interface SendEmailDto {
  subject: string
  message: string
}

export const usersApi = {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(params?: {
    page?: number
    limit?: number
    status?: UserStatus
    role?: string
    search?: string
  }): Promise<UsersResponse> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.role) queryParams.append('role', params.role)
    if (params?.search) queryParams.append('search', params.search)

    const query = queryParams.toString()
    const endpoint = `/api/v1/admin/users${query ? `?${query}` : ''}`

    return await apiClient.get<UsersResponse>(endpoint)
  },

  /**
   * Get a single user by ID
   */
  async getUser(id: number): Promise<UserResponse> {
    return await apiClient.get<UserResponse>(`/api/v1/admin/users/${id}`)
  },

  /**
   * Suspend a user
   */
  async suspendUser(id: number): Promise<UserWithMessageResponse> {
    return await apiClient.patch<UserWithMessageResponse>(`/api/v1/admin/users/${id}/suspend`)
  },

  /**
   * Reactivate a suspended user
   */
  async reactivateUser(id: number): Promise<UserWithMessageResponse> {
    return await apiClient.patch<UserWithMessageResponse>(`/api/v1/admin/users/${id}/reactivate`)
  },

  /**
   * Assign roles to a user
   */
  async assignRoles(id: number, roleIds: number[]): Promise<UserResponse> {
    return await apiClient.put<UserResponse>(`/api/v1/admin/users/${id}/roles`, { roleIds })
  },

  /**
   * Get all available roles
   */
  async getRoles(): Promise<{ roles: Role[] }> {
    // Request all roles without pagination by using a large limit
    const response = await apiClient.get<{
      roles: Role[]
      pagination?: any
    }>('/api/v1/admin/roles?limit=100')
    return { roles: response.roles }
  },

  /**
   * Send email to a user
   */
  async sendEmail(id: number, emailData: SendEmailDto): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>(`/api/v1/admin/users/${id}/send-email`, emailData)
  },
}
