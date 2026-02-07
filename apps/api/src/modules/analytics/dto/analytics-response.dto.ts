import { ApiProperty } from "@nestjs/swagger"

export class StatsDto {
  @ApiProperty({ example: 45231.89 })
  totalRevenue: number

  @ApiProperty({ example: 2350 })
  totalOrders: number

  @ApiProperty({ example: 1234 })
  totalProducts: number

  @ApiProperty({ example: 8234 })
  activeUsers: number

  @ApiProperty({ example: 20.1 })
  revenueChange: number

  @ApiProperty({ example: 180 })
  ordersChange: number

  @ApiProperty({ example: 48 })
  productsChange: number

  @ApiProperty({ example: 12.5 })
  usersChange: number
}

export class RevenueDataPointDto {
  @ApiProperty({ example: "Mon" })
  date: string

  @ApiProperty({ example: 4200 })
  revenue: number

  @ApiProperty({ example: 45 })
  orders: number
}

export class CategoryDataDto {
  @ApiProperty({ example: "Electronics" })
  name: string

  @ApiProperty({ example: 450 })
  value: number

  @ApiProperty({ example: 35.5 })
  percentage: number
}

export class TopProductDto {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: "Wireless Headphones" })
  product: string

  @ApiProperty({ example: 245 })
  sales: number

  @ApiProperty({ example: 12250 })
  revenue: number
}

export class RecentOrderDto {
  @ApiProperty({ example: 1005 })
  id: number

  @ApiProperty({ example: "ORD-2024-1005" })
  orderNumber: string

  @ApiProperty({ example: "Sarah Johnson" })
  customer: string

  @ApiProperty({ example: 234.5 })
  amount: number

  @ApiProperty({ example: "2m ago" })
  time: string

  @ApiProperty({ example: "completed" })
  status: string
}

export class QuickStatsDto {
  @ApiProperty({ example: 3.2 })
  conversionRate: number

  @ApiProperty({ example: 127.5 })
  avgOrderValue: number

  @ApiProperty({ example: 68 })
  customerRetention: number

  @ApiProperty({ example: 24 })
  cartAbandonment: number
}

export class PendingTasksDto {
  @ApiProperty({ example: 45 })
  pendingOrders: number

  @ApiProperty({ example: 12 })
  lowStockItems: number

  @ApiProperty({ example: 28 })
  pendingDeliveries: number

  @ApiProperty({ example: 8 })
  unreadMessages: number
}

export class DashboardAnalyticsDto {
  @ApiProperty({ type: StatsDto })
  stats: StatsDto

  @ApiProperty({ type: [RevenueDataPointDto] })
  revenueData: RevenueDataPointDto[]

  @ApiProperty({ type: [CategoryDataDto] })
  categoryData: CategoryDataDto[]

  @ApiProperty({ type: [TopProductDto] })
  topProducts: TopProductDto[]

  @ApiProperty({ type: [RecentOrderDto] })
  recentOrders: RecentOrderDto[]

  @ApiProperty({ type: QuickStatsDto })
  quickStats: QuickStatsDto

  @ApiProperty({ type: PendingTasksDto })
  pendingTasks: PendingTasksDto
}
