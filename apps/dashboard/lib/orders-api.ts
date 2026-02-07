/**
 * Orders API client
 * Handles order management operations for admin dashboard
 */

import { apiClient } from './api-client'

// Enums
export enum DeliveryStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED_DELIVERY = 'FAILED_DELIVERY',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

export interface OrderItem {
  productId: number
  quantity: number
  price: number
  vatPercentage: number
  vatAmount: number
}

export interface StatusHistoryEntry {
  status: DeliveryStatus
  timestamp: Date | null
  updatedBy: number | null
  notes?: string | null
}

export interface Order {
  id: number
  orderNumber: string
  country: string
  userId: number
  user?: {
    id: number
    email: string
    firstName?: string
    lastName?: string
  }
  deliveryStatus: DeliveryStatus
  subtotal: number
  vatAmount: number
  totalAmount: number
  items: OrderItem[]
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  paidAt?: string
  paymentReference?: string
  paymentNotes?: string
  trackingNumber?: string
  carrier?: string
  estimatedDeliveryDate?: string
  actualDeliveryDate?: string
  deliveryNotes?: string
  statusHistory: StatusHistoryEntry[]
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

export interface OrdersResponse {
  orders: Order[]
  pagination: PaginationMeta
}

export interface TimelineStep {
  status: DeliveryStatus
  timestamp: string | null
  updatedBy: number | null
  notes?: string | null
}

export interface OrderTimelineResponse {
  orderId: number
  currentStatus: DeliveryStatus
  timeline: TimelineStep[]
}

export interface MarkOrderAsPaidDto {
  paymentMethod: PaymentMethod
  paymentReference?: string
  paymentNotes?: string
}

export interface ChangeDeliveryStatusDto {
  status: DeliveryStatus
  trackingNumber?: string
  carrier?: string
  estimatedDeliveryDate?: string
  notes?: string
}

export const ordersApi = {
  /**
   * Get all orders with pagination
   */
  async getOrders(params?: {
    page?: number
    limit?: number
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = `/api/v1/admin/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<OrdersResponse>(url)
  },

  /**
   * Get orders by delivery status
   */
  async getOrdersByStatus(
    status: DeliveryStatus,
    params?: { page?: number; limit?: number }
  ): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const url = `/api/v1/admin/orders/status/${status}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiClient.get<OrdersResponse>(url)
  },

  /**
   * Get a single order by ID
   */
  async getOrder(id: number): Promise<{ order: Order }> {
    return apiClient.get<{ order: Order }>(`/api/v1/orders/${id}`)
  },

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<{ order: Order }> {
    return apiClient.get<{ order: Order }>(`/api/v1/orders/number/${orderNumber}`)
  },

  /**
   * Get order timeline
   */
  async getOrderTimeline(id: number): Promise<OrderTimelineResponse> {
    return apiClient.get<OrderTimelineResponse>(`/api/v1/orders/${id}/timeline`)
  },

  /**
   * Update order delivery status
   */
  async updateDeliveryStatus(
    id: number,
    data: ChangeDeliveryStatusDto
  ): Promise<{ order: Order }> {
    return apiClient.patch<{ order: Order }>(`/api/v1/admin/orders/${id}/delivery-status`, data)
  },

  /**
   * Add delivery notes to order
   */
  async addDeliveryNotes(id: number, notes: string): Promise<{ order: Order }> {
    return apiClient.patch<{ order: Order }>(`/api/v1/admin/orders/${id}/delivery-notes`, {
      notes,
    })
  },

  /**
   * Mark order as paid
   */
  async markOrderAsPaid(
    id: number,
    data: MarkOrderAsPaidDto
  ): Promise<{ order: Order; transaction: any }> {
    return apiClient.patch<{ order: Order; transaction: any }>(
      `/api/v1/admin/orders/${id}/mark-as-paid`,
      data
    )
  },
}
