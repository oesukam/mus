/**
 * Orders API client for customer-facing platform
 * Handles order creation and retrieval
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

// Types
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

export interface CreateOrderDto {
  country: string
  items: OrderItem[]
  subtotal: number
  vatAmount: number
  totalAmount: number
  recipientName?: string
  recipientEmail: string
  recipientPhone?: string
  shippingAddress: string
  shippingCity: string
  shippingState?: string
  shippingZipCode?: string
  shippingCountry: string
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

export interface TrackOrderDto {
  orderNumber: string
  email?: string
  phone?: string
}

export interface TrackOrderResponse {
  order: Order
  timeline: Array<{
    id: number
    order: number
    status: DeliveryStatus
    label: string
    timestamp?: string
    isCompleted: boolean
    isCurrent: boolean
    notes?: string
  }>
}

export const ordersApi = {
  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderDto, token?: string): Promise<{ order: Order }> {
    return apiClient.post<{ order: Order }>('/api/v1/orders', orderData, token ? { token } : undefined)
  },

  /**
   * Get orders for the current authenticated user
   */
  async getUserOrders(): Promise<{ orders: Order[] }> {
    return apiClient.get<{ orders: Order[] }>('/api/v1/auth/orders')
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
   * Get order timeline by ID
   */
  async getOrderTimeline(id: number): Promise<OrderTimelineResponse> {
    return apiClient.get<OrderTimelineResponse>(`/api/v1/orders/${id}/timeline`)
  },

  /**
   * Get order timeline by order number
   */
  async getOrderTimelineByNumber(orderNumber: string): Promise<OrderTimelineResponse> {
    return apiClient.get<OrderTimelineResponse>(`/api/v1/orders/number/${orderNumber}/timeline`)
  },

  /**
   * Track order by order number with email or phone verification (public endpoint)
   */
  async trackOrder(trackData: TrackOrderDto): Promise<TrackOrderResponse> {
    const params = new URLSearchParams({
      orderNumber: trackData.orderNumber,
    })
    if (trackData.email) params.append('email', trackData.email)
    if (trackData.phone) params.append('phone', trackData.phone)

    return apiClient.get<TrackOrderResponse>(`/api/v1/orders/track?${params.toString()}`)
  },
}
