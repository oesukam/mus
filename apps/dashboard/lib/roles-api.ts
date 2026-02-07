/**
 * Roles and Permissions API client
 * Handles role and permission management operations for admin dashboard
 */

import { apiClient } from './api-client'

export interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: number
  name: string
  displayName: string
  description?: string
  permissions: Permission[]
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRoleDto {
  name: string
  displayName: string
  description?: string
}

export interface UpdateRoleDto {
  name?: string
  displayName?: string
  description?: string
}

export interface AssignPermissionsDto {
  permissionIds: number[]
}

export interface CreatePermissionDto {
  name: string
  resource: string
  action: string
  description?: string
}

export interface UpdatePermissionDto {
  name?: string
  resource?: string
  action?: string
  description?: string
}

export interface RolesResponse {
  roles: Role[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export const rolesApi = {
  /**
   * Get all roles with pagination and filtering
   */
  async getRoles(params?: {
    page?: number
    limit?: number
    q?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<RolesResponse> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.q) queryParams.append('q', params.q)
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

    const query = queryParams.toString()
    const endpoint = `/api/v1/admin/roles${query ? `?${query}` : ''}`

    return await apiClient.get<RolesResponse>(endpoint)
  },

  /**
   * Get a single role by ID
   */
  async getRole(id: number): Promise<{ role: Role }> {
    return await apiClient.get<{ role: Role }>(`/api/v1/admin/roles/${id}`)
  },

  /**
   * Create a new role
   */
  async createRole(data: CreateRoleDto): Promise<{ role: Role }> {
    return await apiClient.post<{ role: Role }>('/api/v1/admin/roles', data)
  },

  /**
   * Update a role
   */
  async updateRole(id: number, data: UpdateRoleDto): Promise<{ role: Role }> {
    return await apiClient.put<{ role: Role }>(`/api/v1/admin/roles/${id}`, data)
  },

  /**
   * Delete a role
   */
  async deleteRole(id: number): Promise<void> {
    return await apiClient.delete<void>(`/api/v1/admin/roles/${id}`)
  },

  /**
   * Assign permissions to a role
   */
  async assignPermissions(id: number, permissionIds: number[]): Promise<{ role: Role }> {
    return await apiClient.put<{ role: Role }>(`/api/v1/admin/roles/${id}/permissions`, {
      permissionIds,
    })
  },
}

export interface PermissionsResponse {
  permissions: Permission[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export const permissionsApi = {
  /**
   * Get all permissions with pagination and filtering
   */
  async getPermissions(params?: {
    page?: number
    limit?: number
    resource?: string
    q?: string
  }): Promise<PermissionsResponse> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.resource) queryParams.append('resource', params.resource)
    if (params?.q) queryParams.append('q', params.q)

    const query = queryParams.toString()
    const endpoint = `/api/v1/admin/permissions${query ? `?${query}` : ''}`

    return await apiClient.get<PermissionsResponse>(endpoint)
  },

  /**
   * Get a single permission by ID
   */
  async getPermission(id: number): Promise<{ permission: Permission }> {
    return await apiClient.get<{ permission: Permission }>(`/api/v1/admin/permissions/${id}`)
  },

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: string): Promise<{ permissions: Permission[] }> {
    return await apiClient.get<{ permissions: Permission[] }>(
      `/api/v1/admin/permissions/resource/${resource}`,
    )
  },

  /**
   * Create a new permission
   */
  async createPermission(data: CreatePermissionDto): Promise<{ permission: Permission }> {
    return await apiClient.post<{ permission: Permission }>('/api/v1/admin/permissions', data)
  },

  /**
   * Update a permission
   */
  async updatePermission(id: number, data: UpdatePermissionDto): Promise<{ permission: Permission }> {
    return await apiClient.put<{ permission: Permission }>(`/api/v1/admin/permissions/${id}`, data)
  },

  /**
   * Delete a permission
   */
  async deletePermission(id: number): Promise<void> {
    return await apiClient.delete<void>(`/api/v1/admin/permissions/${id}`)
  },

  /**
   * Seed default permissions
   */
  async seedDefaults(): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>('/api/v1/admin/permissions/seed')
  },
}
