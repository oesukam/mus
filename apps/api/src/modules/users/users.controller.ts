import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { UsersService } from "./users.service"
import { User } from "./entities/user.entity"
import { UpdateProfileDto } from "./dto/update-profile.dto"
import { ChangePasswordDto } from "./dto/change-password.dto"
import { UpdateSettingsDto } from "./dto/update-settings.dto"
import {
  UserWithMessageResponseDto,
  UserMessageResponseDto,
} from "./dto/user-response.dto"
import { SettingsResponseDto, SettingsWithMessageResponseDto } from "./dto/settings-response.dto"
import { RolesGuard } from "../auth/guards/roles.guard"

@ApiTags("users")
@Controller("users")
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch("profile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
    type: UserWithMessageResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<{ message: string; user: User }> {
    const user = await this.usersService.updateProfile(req.user.id, updateProfileDto)
    return {
      message: "Profile updated successfully",
      user,
    }
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change password for current user" })
  @ApiResponse({
    status: 200,
    description: "Password changed successfully",
    type: UserMessageResponseDto,
  })
  @ApiResponse({ status: 400, description: "Current password is incorrect" })
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.changePassword(req.user.id, changePasswordDto)
    return {
      message: "Password changed successfully",
    }
  }

  @Get("settings")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user settings" })
  @ApiResponse({
    status: 200,
    description: "Settings retrieved successfully",
    type: SettingsResponseDto,
  })
  async getSettings(@Request() req: any): Promise<{ settings: any }> {
    const settings = await this.usersService.getSettings(req.user.id)
    return { settings }
  }

  @Patch("settings")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user settings" })
  @ApiResponse({
    status: 200,
    description: "Settings updated successfully",
    type: SettingsWithMessageResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async updateSettings(
    @Request() req: any,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ): Promise<{ message: string; settings: any }> {
    const settings = await this.usersService.updateSettings(req.user.id, updateSettingsDto)
    return {
      message: "Settings updated successfully",
      settings,
    }
  }
}
