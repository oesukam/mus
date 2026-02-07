import { Controller, Get, Post, Body, Param, Request } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { CacheTTL } from "@nestjs/cache-manager"
import { FeatureFlagService } from "./feature-flag.service"
import { BatchCheckFlagsDto, BatchCheckResultDto } from "./dto/batch-check-flags.dto"
import { FeatureFlagStateDto } from "./dto/feature-flag-response.dto"
import { CustomRequest } from "@/common/types/custom-request"

@ApiTags("auth / me / features-flags")
@ApiBearerAuth("JWT-auth")
@Controller("auth/me/features-flags")
export class FeatureFlagsUserController {
  constructor(private readonly featureFlagsService: FeatureFlagService) {}

  @Get(":key/check")
  @CacheTTL(60000) // Cache for 1 minute (60000ms)
  @ApiOperation({ summary: "Check if a feature flag is enabled for the current user" })
  @ApiResponse({
    status: 200,
    description: "Returns the feature flag state for the current user",
    type: FeatureFlagStateDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async checkFeature(@Param("key") key: string, @Request() req: CustomRequest) {
    const isEnabled = await this.featureFlagsService.isFeatureEnabled(key, req.user)
    return { key, isEnabled }
  }

  @Post("check-batch")
  @ApiOperation({ summary: "Check multiple feature flags at once for the current user" })
  @ApiResponse({
    status: 200,
    description: "Returns the state of all requested feature flags",
    type: BatchCheckResultDto,
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid keys array" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async checkBatch(@Body() batchCheckDto: BatchCheckFlagsDto, @Request() req: CustomRequest) {
    const flags = await this.featureFlagsService.batchCheckFeatures(batchCheckDto.keys, req.user)
    return { flags }
  }

  @Get("enabled")
  @CacheTTL(60000) // Cache for 1 minute (60000ms)
  @ApiOperation({ summary: "Get all enabled feature flags for the current user" })
  @ApiResponse({
    status: 200,
    description: "Returns array of enabled feature flag keys",
    schema: {
      type: "object",
      properties: {
        features: {
          type: "array",
          items: { type: "string" },
          example: ["new-checkout", "advanced-analytics"],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getEnabledFeatures(@Request() req: CustomRequest) {
    const features = await this.featureFlagsService.getEnabledFeaturesForUser(req.user)
    return { features }
  }
}
