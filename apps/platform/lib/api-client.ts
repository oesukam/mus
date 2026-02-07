/**
 * API Client for backend communication
 * Handles HTTP requests with automatic JWT token management
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const PLATFORM_VERSION = '0.1.0'
const PLATFORM_NAME = 'MUS-Platform'

interface RequestOptions extends RequestInit {
  token?: string
}

class ApiClient {
  private baseUrl: string
  private userAgent: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Create User-Agent string: "MUS-Platform/0.1.0 (Next.js/16.0.0)"
    const runtime = typeof window !== 'undefined' ? 'Browser' : 'Server'
    this.userAgent = `${PLATFORM_NAME}/${PLATFORM_VERSION} (Next.js; ${runtime})`
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { token, headers, ...restOptions } = options

    const authToken = token || this.getAuthToken()

    const config: RequestInit = {
      ...restOptions,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...headers,
      },
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config)

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      let data: any

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new ApiError(
          data?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        )
      }

      return data as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError('Network error. Please check your connection.', 0)
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const apiClient = new ApiClient(API_URL)
