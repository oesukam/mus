/**
 * Files API client
 * Handles file upload and management operations for admin dashboard
 */

import { apiClient } from './api-client'

export interface FileEntity {
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
  folder: string
  uploadedBy?: number
  entityType?: string
  entityId?: number
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

export interface FilesResponse {
  files: FileEntity[]
  pagination: PaginationMeta
}

export interface UploadResponse {
  id: number
  url: string
  originalName: string
  size: number
  mimeType: string
  message: string
}

export const filesApi = {
  /**
   * Get all files with pagination and filtering
   */
  async getFiles(params?: {
    page?: number
    limit?: number
    folder?: string
    entityType?: string
  }): Promise<FilesResponse> {
    const queryParams = new URLSearchParams()

    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.folder) queryParams.append('folder', params.folder)
    if (params?.entityType) queryParams.append('entityType', params.entityType)

    const url = `/api/v1/admin/files${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<FilesResponse>(url)
  },

  /**
   * Upload a single file
   */
  async uploadFile(
    file: File,
    folder: string = 'uploads',
    title?: string,
    description?: string
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    if (title) formData.append('title', title)
    if (description) formData.append('description', description)

    return apiClient.post<UploadResponse>('/api/v1/admin/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  /**
   * Delete a file
   */
  async deleteFile(url: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>('/api/v1/admin/files', {
      data: { url },
    })
  },

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(files: File[], folder: string = 'uploads'): Promise<{ urls: string[]; message: string }> {
    const formData = new FormData()

    files.forEach((file) => {
      formData.append('files', file)
    })
    formData.append('folder', folder)

    return apiClient.post<{ urls: string[]; message: string }>('/api/v1/admin/files/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
