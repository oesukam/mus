/**
 * Analytics API client
 * Handles dashboard analytics data fetching
 */

import { apiClient } from './api-client'

export interface Stats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  activeUsers: number
  revenueChange: number
  ordersChange: number
  productsChange: number
  usersChange: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface CategoryData {
  name: string
  value: number
  percentage: number
}

export interface TopProduct {
  id: number
  product: string
  sales: number
  revenue: number
}

export interface RecentOrder {
  id: number
  orderNumber: string
  customer: string
  amount: number
  time: string
  status: string
}

export interface QuickStats {
  conversionRate: number
  avgOrderValue: number
  customerRetention: number
  cartAbandonment: number
}

export interface PendingTasks {
  pendingOrders: number
  lowStockItems: number
  pendingDeliveries: number
  unreadMessages: number
}

export interface DashboardAnalytics {
  stats: Stats
  revenueData: RevenueDataPoint[]
  categoryData: CategoryData[]
  topProducts: TopProduct[]
  recentOrders: RecentOrder[]
  quickStats: QuickStats
  pendingTasks: PendingTasks
}

export const analyticsApi = {
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    return apiClient.get<DashboardAnalytics>('/api/v1/admin/analytics/dashboard')
  },
}
