import { Controller, Get, Param, Body, UseGuards, Request, Query, Post } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { OrdersService } from "./orders.service"
import { Order } from "./entities/order.entity"
import { CreateOrderDto } from "./dto/create-order.dto"
import { TrackOrderDto } from "./dto/track-order.dto"
import { OrderResponseDto } from "./dto/order-response.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { OptionalAuth } from "../auth/decorators/optional-auth.decorator"
import { Public } from "../auth/decorators/public.decorator"
import { User } from "../users/entities/user.entity"

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @OptionalAuth()
  @ApiOperation({ summary: "Create a new order (supports guest checkout)" })
  @ApiResponse({
    status: 201,
    description: "Order created successfully with auto-generated order number",
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(
    @Body() createOrderDto: CreateOrderDto,
    @Request() req: { user?: User },
  ): Promise<{ order: Order }> {
    // For authenticated users, use their userId; for guest checkout, userId will be null
    const userId = req.user?.id || null
    console.log("Orders Controller - Creating order:", {
      userId,
      userType: userId ? "authenticated" : "guest",
      hasUser: !!req.user,
      recipientEmail: createOrderDto.recipientEmail,
    })
    const order = await this.ordersService.create(createOrderDto, userId)
    return { order }
  }

  @Get("track")
  @Public()
  @ApiOperation({
    summary: "Track order by order number with email or phone verification (public endpoint)",
  })
  @ApiResponse({
    status: 200,
    description: "Order tracking information retrieved successfully",
    schema: {
      type: "object",
      properties: {
        order: {
          type: "object",
          description: "Order details",
        },
        timeline: {
          type: "array",
          description: "Order tracking timeline",
          items: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
              order: { type: "number", example: 1 },
              status: { type: "string", example: "PENDING" },
              label: { type: "string", example: "Order Placed" },
              timestamp: { type: "string", format: "date-time", example: "2024-01-10T10:00:00Z" },
              isCompleted: { type: "boolean", example: true },
              isCurrent: { type: "boolean", example: false },
              notes: { type: "string", example: "Order received" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid data or verification failed" })
  @ApiResponse({ status: 404, description: "Order not found" })
  async trackOrder(@Query() trackOrderDto: TrackOrderDto) {
    return this.ordersService.trackOrder(
      trackOrderDto.orderNumber,
      trackOrderDto.email,
      trackOrderDto.phone,
    )
  }

  @Get("number/:orderNumber")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Get an order by order number" })
  @ApiResponse({ status: 200, description: "Order retrieved successfully", type: OrderResponseDto })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findByOrderNumber(@Param("orderNumber") orderNumber: string): Promise<{ order: Order }> {
    const order = await this.ordersService.findByOrderNumber(orderNumber)
    return { order }
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Get an order by ID or order number" })
  @ApiResponse({ status: 200, description: "Order retrieved successfully", type: OrderResponseDto })
  @ApiResponse({ status: 404, description: "Order not found" })
  async findOne(@Param("id") id: string): Promise<{ order: Order }> {
    // Check if the id parameter is a number (ID) or string (order number)
    const isNumeric = /^\d+$/.test(id)

    if (isNumeric) {
      const order = await this.ordersService.findOne(+id)
      return { order }
    } else {
      const order = await this.ordersService.findByOrderNumber(id)
      return { order }
    }
  }

  @Get("number/:orderNumber/timeline")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Get order tracking timeline by order number" })
  @ApiResponse({
    status: 200,
    description: "Order timeline retrieved successfully",
    schema: {
      type: "object",
      properties: {
        orderId: { type: "number", example: 1 },
        currentStatus: { type: "string", example: "shipped" },
        timeline: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "number",
                example: 1,
                description: "Unique identifier for this timeline step",
              },
              order: { type: "number", example: 1, description: "Display order (1-4)" },
              status: { type: "string", example: "PENDING" },
              label: { type: "string", example: "Order Placed" },
              timestamp: { type: "string", format: "date-time", example: "2024-01-10T10:00:00Z" },
              isCompleted: { type: "boolean", example: true },
              isCurrent: { type: "boolean", example: false },
              notes: { type: "string", example: "Order received" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  async getOrderTimelineByNumber(@Param("orderNumber") orderNumber: string) {
    const order = await this.ordersService.findByOrderNumber(orderNumber)
    return this.ordersService.getOrderTimeline(order.id)
  }

  @Get(":id/timeline")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Get order tracking timeline by ID or order number" })
  @ApiResponse({
    status: 200,
    description: "Order timeline retrieved successfully",
    schema: {
      type: "object",
      properties: {
        orderId: { type: "number", example: 1 },
        currentStatus: { type: "string", example: "shipped" },
        timeline: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "number",
                example: 1,
                description: "Unique identifier for this timeline step",
              },
              order: { type: "number", example: 1, description: "Display order (1-4)" },
              status: { type: "string", example: "PENDING" },
              label: { type: "string", example: "Order Placed" },
              timestamp: { type: "string", format: "date-time", example: "2024-01-10T10:00:00Z" },
              isCompleted: { type: "boolean", example: true },
              isCurrent: { type: "boolean", example: false },
              notes: { type: "string", example: "Order received" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  async getOrderTimeline(@Param("id") id: string) {
    // Check if the id parameter is a number (ID) or string (order number)
    const isNumeric = /^\d+$/.test(id)

    if (isNumeric) {
      return this.ordersService.getOrderTimeline(+id)
    } else {
      const order = await this.ordersService.findByOrderNumber(id)
      return this.ordersService.getOrderTimeline(order.id)
    }
  }
}
