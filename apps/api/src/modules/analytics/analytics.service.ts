import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, MoreThanOrEqual } from "typeorm"
import { Order } from "../orders/entities/order.entity"
import { Product } from "../products/entities/product.entity"
import { User } from "../users/entities/user.entity"
import { UserStatus } from "../users/enums/user-status.enum"
import { DeliveryStatus } from "../orders/enums/delivery-status.enum"
import {
  DashboardAnalyticsDto,
  StatsDto,
  RevenueDataPointDto,
  CategoryDataDto,
  TopProductDto,
  RecentOrderDto,
  QuickStatsDto,
  PendingTasksDto,
} from "./dto/analytics-response.dto"

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getDashboardAnalytics(): Promise<DashboardAnalyticsDto> {
    const [stats, revenueData, categoryData, topProducts, recentOrders, quickStats, pendingTasks] =
      await Promise.all([
        this.getStats(),
        this.getRevenueData(),
        this.getCategoryData(),
        this.getTopProducts(),
        this.getRecentOrders(),
        this.getQuickStats(),
        this.getPendingTasks(),
      ])

    return {
      stats,
      revenueData,
      categoryData,
      topProducts,
      recentOrders,
      quickStats,
      pendingTasks,
    }
  }

  private async getStats(): Promise<StatsDto> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Get current period stats
    const [totalOrders, totalProducts, activeUsers, currentRevenue] = await Promise.all([
      this.ordersRepository.count({ where: { status: "completed" } }),
      this.productsRepository.count(),
      this.usersRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.ordersRepository
        .createQueryBuilder("order")
        .select("COALESCE(SUM(order.totalAmount), 0)", "total")
        .where("order.status = :status", { status: "completed" })
        .andWhere("order.paidAt >= :thirtyDaysAgo", { thirtyDaysAgo })
        .getRawOne()
        .then((result) => parseFloat(result.total) || 0),
    ])

    // Get previous period stats for comparison
    const [previousOrders, previousProducts, previousUsers, previousRevenue] = await Promise.all([
      this.ordersRepository
        .createQueryBuilder("order")
        .where("order.status = :status", { status: "completed" })
        .andWhere("order.paidAt >= :sixtyDaysAgo AND order.paidAt < :thirtyDaysAgo", {
          sixtyDaysAgo,
          thirtyDaysAgo,
        })
        .getCount(),
      // For products and users, we'll use a simple percentage based on creation date
      this.productsRepository
        .createQueryBuilder("product")
        .where("product.createdAt >= :sixtyDaysAgo AND product.createdAt < :thirtyDaysAgo", {
          sixtyDaysAgo,
          thirtyDaysAgo,
        })
        .getCount(),
      this.usersRepository
        .createQueryBuilder("user")
        .where("user.createdAt >= :sixtyDaysAgo AND user.createdAt < :thirtyDaysAgo", {
          sixtyDaysAgo,
          thirtyDaysAgo,
        })
        .getCount(),
      this.ordersRepository
        .createQueryBuilder("order")
        .select("COALESCE(SUM(order.totalAmount), 0)", "total")
        .where("order.status = :status", { status: "completed" })
        .andWhere("order.paidAt >= :sixtyDaysAgo AND order.paidAt < :thirtyDaysAgo", {
          sixtyDaysAgo,
          thirtyDaysAgo,
        })
        .getRawOne()
        .then((result) => parseFloat(result.total) || 0),
    ])

    // Calculate changes
    const revenueChange =
      previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const ordersChange = totalOrders - previousOrders
    const productsChange = totalProducts - previousProducts
    const usersChange =
      previousUsers > 0 ? ((activeUsers - previousUsers) / previousUsers) * 100 : 0

    return {
      totalRevenue: currentRevenue,
      totalOrders,
      totalProducts,
      activeUsers,
      revenueChange: Math.round(revenueChange * 10) / 10,
      ordersChange,
      productsChange,
      usersChange: Math.round(usersChange * 10) / 10,
    }
  }

  private async getRevenueData(): Promise<RevenueDataPointDto[]> {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const dailyData = await this.ordersRepository
      .createQueryBuilder("order")
      .select("DATE(order.paidAt)", "date")
      .addSelect("COALESCE(SUM(order.totalAmount), 0)", "revenue")
      .addSelect("COUNT(*)", "orders")
      .where("order.status = :status", { status: "completed" })
      .andWhere("order.paidAt >= :sevenDaysAgo", { sevenDaysAgo })
      .groupBy("DATE(order.paidAt)")
      .orderBy("date", "ASC")
      .getRawMany()

    // Format dates to day names
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return dailyData.map((data) => {
      const date = new Date(data.date)
      return {
        date: dayNames[date.getDay()],
        revenue: parseFloat(data.revenue) || 0,
        orders: parseInt(data.orders) || 0,
      }
    })
  }

  private async getCategoryData(): Promise<CategoryDataDto[]> {
    const categoryStats = await this.productsRepository
      .createQueryBuilder("product")
      .select("product.category", "name")
      .addSelect("COUNT(*)", "value")
      .groupBy("product.category")
      .getRawMany()

    const total = categoryStats.reduce((sum, cat) => sum + parseInt(cat.value), 0)

    return categoryStats.map((cat) => ({
      name: cat.name || "Uncategorized",
      value: parseInt(cat.value) || 0,
      percentage: total > 0 ? Math.round((parseInt(cat.value) / total) * 1000) / 10 : 0,
    }))
  }

  private async getTopProducts(): Promise<TopProductDto[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get completed orders with items
    const orders = await this.ordersRepository
      .createQueryBuilder("order")
      .where("order.status = :status", { status: "completed" })
      .andWhere("order.paidAt >= :thirtyDaysAgo", { thirtyDaysAgo })
      .getMany()

    // Aggregate product sales
    const productSales: Record<number, { sales: number; revenue: number }> = {}

    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const productId = item.productId
          if (!productSales[productId]) {
            productSales[productId] = { sales: 0, revenue: 0 }
          }
          productSales[productId].sales += item.quantity
          productSales[productId].revenue += item.price * item.quantity
        })
      }
    })

    // Get top 5 products
    const topProductIds = Object.entries(productSales)
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, 5)
      .map(([id]) => parseInt(id))

    if (topProductIds.length === 0) {
      return []
    }

    // Fetch product details
    const products = await this.productsRepository
      .createQueryBuilder("product")
      .where("product.id IN (:...ids)", { ids: topProductIds })
      .getMany()

    // Build result maintaining order
    return topProductIds
      .map((id) => {
        const product = products.find((p) => p.id === id)
        if (!product) return null

        return {
          id,
          product: product.name,
          sales: productSales[id].sales,
          revenue: productSales[id].revenue,
        }
      })
      .filter((p): p is TopProductDto => p !== null)
  }

  private async getRecentOrders(): Promise<RecentOrderDto[]> {
    const orders = await this.ordersRepository
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.user", "user")
      .orderBy("order.createdAt", "DESC")
      .limit(5)
      .getMany()

    return orders.map((order) => {
      const now = new Date()
      const createdAt = new Date(order.createdAt)
      const diffMs = now.getTime() - createdAt.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)

      let time: string
      if (diffMins < 1) {
        time = "Just now"
      } else if (diffMins < 60) {
        time = `${diffMins}m ago`
      } else if (diffHours < 24) {
        time = `${diffHours}h ago`
      } else {
        time = `${Math.floor(diffHours / 24)}d ago`
      }

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user?.name || "Guest",
        amount: order.totalAmount,
        time,
        status: order.status,
      }
    })
  }

  private async getQuickStats(): Promise<QuickStatsDto> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [totalOrders, completedOrders, totalRevenue] = await Promise.all([
      this.ordersRepository.count({
        where: { createdAt: MoreThanOrEqual(thirtyDaysAgo) },
      }),
      this.ordersRepository.count({
        where: {
          status: "completed",
          createdAt: MoreThanOrEqual(thirtyDaysAgo),
        },
      }),
      this.ordersRepository
        .createQueryBuilder("order")
        .select("COALESCE(SUM(order.totalAmount), 0)", "total")
        .where("order.status = :status", { status: "completed" })
        .andWhere("order.paidAt >= :thirtyDaysAgo", { thirtyDaysAgo })
        .getRawOne()
        .then((result) => parseFloat(result.total) || 0),
    ])

    const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

    return {
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      customerRetention: 68, // TODO: Calculate based on repeat customers
      cartAbandonment: 24, // TODO: Calculate based on cart data
    }
  }

  private async getPendingTasks(): Promise<PendingTasksDto> {
    const [pendingOrders, lowStockItems] = await Promise.all([
      this.ordersRepository.count({ where: { deliveryStatus: DeliveryStatus.PENDING } }),
      this.productsRepository
        .createQueryBuilder("product")
        .where("product.stockQuantity <= :lowStockThreshold", { lowStockThreshold: 10 })
        .getCount(),
    ])

    return {
      pendingOrders,
      lowStockItems,
      pendingDeliveries: 0, // TODO: Calculate based on delivery status
      unreadMessages: 0, // TODO: Calculate based on contact messages
    }
  }
}
