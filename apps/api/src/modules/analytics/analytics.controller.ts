import { Controller, Get, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { AnalyticsService } from "./analytics.service"
import { DashboardAnalyticsDto } from "./dto/analytics-response.dto"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { Permissions } from "../auth/decorators/permissions.decorator"

@ApiTags("admin / analytics")
@ApiBearerAuth("JWT-auth")
@Controller("admin/analytics")
@UseGuards(PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboard")
  @Permissions("products:read", "orders:read", "users:read") // Requires any of these permissions
  @ApiOperation({ summary: "Get dashboard analytics data" })
  @ApiResponse({
    status: 200,
    description: "Returns comprehensive dashboard analytics",
    type: DashboardAnalyticsDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires analytics permissions" })
  async getDashboardAnalytics(): Promise<DashboardAnalyticsDto> {
    return this.analyticsService.getDashboardAnalytics()
  }
}
