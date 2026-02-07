import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { CacheTTL } from "@nestjs/cache-manager"
import { FeatureFlagService } from "./feature-flag.service"
import { CreateFeatureFlagDto } from "./dto/create-feature-flag.dto"
import { UpdateFeatureFlagDto } from "./dto/update-feature-flag.dto"
import { ToggleFeatureFlagDto } from "./dto/toggle-feature-flag.dto"
import {
  FeatureFlagResponseDto,
  FeatureFlagsResponseDto,
} from "./dto/feature-flag-response.dto"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { Permissions } from "../auth/decorators/permissions.decorator"

@ApiTags("admin / features-flags")
@ApiBearerAuth("JWT-auth")
@Controller("admin/features-flags")
@UseGuards(PermissionsGuard)
export class FeatureFlagsAdminController {
  constructor(private readonly featureFlagsService: FeatureFlagService) {}

  @Post()
  @Permissions("features-flags:write")
  @ApiOperation({ summary: "Create a new feature flag (Admin only)" })
  @ApiResponse({
    status: 201,
    description: "Feature flag created successfully",
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 409, description: "Feature flag already exists" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires features-flags:write permission" })
  async create(@Body() createFeatureFlagDto: CreateFeatureFlagDto) {
    const featureFlag = await this.featureFlagsService.create(createFeatureFlagDto)
    return { featureFlag }
  }

  @Get()
  @CacheTTL(300000) // Cache for 5 minutes (300000ms)
  @Permissions("features-flags:read")
  @ApiOperation({ summary: "Get all feature flags (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Returns all feature flags",
    type: FeatureFlagsResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires features-flags:read permission" })
  async findAll() {
    const featureFlags = await this.featureFlagsService.findAll()
    return { featureFlags }
  }

  @Get(":id")
  @Permissions("features-flags:read")
  @ApiOperation({ summary: "Get a feature flag by ID (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Returns the feature flag",
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 404, description: "Feature flag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires features-flags:read permission" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const featureFlag = await this.featureFlagsService.findOne(id)
    return { featureFlag }
  }

  @Put(":id")
  @Permissions("features-flags:write")
  @ApiOperation({ summary: "Update a feature flag (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Feature flag updated successfully",
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 404, description: "Feature flag not found" })
  @ApiResponse({ status: 409, description: "Feature flag key already exists" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires features-flags:write permission" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateFeatureFlagDto: UpdateFeatureFlagDto,
  ) {
    const featureFlag = await this.featureFlagsService.update(id, updateFeatureFlagDto)
    return { featureFlag }
  }

  @Patch(":id/toggle")
  @Permissions("features-flags:write")
  @ApiOperation({ summary: "Toggle a feature flag on/off (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Feature flag toggled successfully",
    type: FeatureFlagResponseDto,
  })
  @ApiResponse({ status: 404, description: "Feature flag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires features-flags:write permission" })
  async toggle(@Param("id", ParseIntPipe) id: number, @Body() toggleDto: ToggleFeatureFlagDto) {
    const featureFlag = await this.featureFlagsService.toggle(id, toggleDto.isEnabled)
    return { featureFlag }
  }

  @Delete(":id")
  @Permissions("features-flags:delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a feature flag (Admin only)" })
  @ApiResponse({ status: 204, description: "Feature flag deleted successfully" })
  @ApiResponse({ status: 404, description: "Feature flag not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - requires features-flags:delete permission",
  })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.featureFlagsService.remove(id)
  }

  @Post("seed")
  @Permissions("features-flags:write")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Seed default feature flags (Admin only)" })
  @ApiResponse({ status: 200, description: "Default feature flags seeded successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - requires features-flags:write permission" })
  async seedDefaults() {
    await this.featureFlagsService.seedDefaultFeatureFlags()
    return { message: "Default feature flags seeded successfully" }
  }
}
