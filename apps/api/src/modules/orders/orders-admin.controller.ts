import { Controller, Get, Param, Patch, Body, UseGuards, Request, Query } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { OrdersService } from "./orders.service"
import { Order } from "./entities/order.entity"
import { ChangeDeliveryStatusDto } from "./dto/change-delivery-status.dto"
import { MarkOrderAsPaidDto } from "./dto/mark-order-as-paid.dto"
import { OrderResponseDto, OrdersResponseDto } from "./dto/order-response.dto"
import { DeliveryStatus } from "./enums/delivery-status.enum"
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { Permissions } from "../auth/decorators/permissions.decorator"

@ApiTags("admin / orders")
@Controller("admin/orders")
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Permissions('orders:read')
  @ApiOperation({ summary: "Get all orders (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Orders retrieved successfully",
    type: OrdersResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden - Requires orders:read permission" })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.ordersService.findAll(paginationQuery)
  }

  @Get("status/:status")
  @Permissions('orders:read')
  @ApiOperation({ summary: "Get orders by delivery status (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Orders retrieved successfully",
    type: OrdersResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden - Requires orders:read permission" })
  async getOrdersByStatus(
    @Param("status") status: DeliveryStatus,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return await this.ordersService.getOrdersByDeliveryStatus(status, paginationQuery)
  }

  @Patch(":id/delivery-status")
  @Permissions('orders:write')
  @ApiOperation({ summary: "Change delivery status of an order (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Delivery status updated successfully",
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid status transition" })
  @ApiResponse({ status: 404, description: "Order not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires orders:write permission" })
  async changeDeliveryStatus(
    @Param("id") id: string,
    @Body() changeStatusDto: ChangeDeliveryStatusDto,
    @Request() req,
  ): Promise<{ order: Order }> {
    const order = await this.ordersService.changeDeliveryStatus(
      +id,
      changeStatusDto,
      req.user.id,
    )
    return { order }
  }

  @Patch(":id/delivery-notes")
  @Permissions('orders:write')
  @ApiOperation({ summary: "Add delivery notes to an order (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Delivery notes added successfully",
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: "Order not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires orders:write permission" })
  async addDeliveryNotes(
    @Param("id") id: string,
    @Body("notes") notes: string,
  ): Promise<{ order: Order }> {
    const order = await this.ordersService.addDeliveryNotes(+id, notes)
    return { order }
  }

  @Patch(":id/mark-as-paid")
  @Permissions('orders:write')
  @ApiOperation({ summary: "Mark order as paid and record sale (Admin only)" })
  @ApiResponse({
    status: 200,
    description:
      "Order marked as paid successfully, sale recorded, and confirmation email sent to customer",
  })
  @ApiResponse({ status: 400, description: "Order already paid or invalid data" })
  @ApiResponse({ status: 404, description: "Order not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires orders:write permission" })
  async markAsPaid(
    @Param("id") id: string,
    @Body() markAsPaidDto: MarkOrderAsPaidDto,
    @Request() req,
  ) {
    return this.ordersService.markAsPaid(+id, markAsPaidDto, req.user.id)
  }
}
