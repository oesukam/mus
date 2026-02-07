import { Controller, Get, Patch, Put, Post, Param, Query, UseGuards, Body, HttpCode, HttpStatus } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { UsersService } from "./users.service"
import { User } from "./entities/user.entity"
import {
  UserResponseDto,
  UsersResponseDto,
  UserWithMessageResponseDto,
} from "./dto/user-response.dto"
import { AssignRolesDto } from "./dto/assign-roles.dto"
import { SendEmailDto } from "./dto/send-email.dto"
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto"
import { PermissionsGuard } from "../auth/guards/permissions.guard"
import { Permissions } from "../auth/decorators/permissions.decorator"

@ApiTags("admin / users")
@Controller("admin/users")
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions("users:read")
  @ApiOperation({ summary: "Get all users (Admin only)" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully", type: UsersResponseDto })
  @ApiResponse({ status: 403, description: "Forbidden - Requires users:read permission" })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.usersService.findAll(paginationQuery)
  }

  @Get(":id")
  @Permissions("users:read")
  @ApiOperation({ summary: "Get a user by ID (Admin only)" })
  @ApiResponse({ status: 200, description: "User retrieved successfully", type: UserResponseDto })
  @ApiResponse({ status: 403, description: "Forbidden - Requires users:read permission" })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id") id: string): Promise<{ user: User }> {
    const user = await this.usersService.findOne(+id)
    return { user }
  }

  @Patch(":id/suspend")
  @Permissions("users:write")
  @ApiOperation({ summary: "Suspend a user (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "User suspended successfully",
    type: UserWithMessageResponseDto,
  })
  @ApiResponse({ status: 400, description: "User is already suspended" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires users:write permission" })
  @ApiResponse({ status: 404, description: "User not found" })
  async suspendUser(@Param("id") id: string): Promise<{ message: string; user: User }> {
    const user = await this.usersService.suspendUser(+id)
    return {
      message: "User suspended successfully",
      user,
    }
  }

  @Patch(":id/reactivate")
  @Permissions("users:write")
  @ApiOperation({ summary: "Reactivate a suspended user (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "User reactivated successfully",
    type: UserWithMessageResponseDto,
  })
  @ApiResponse({ status: 400, description: "User is already active" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires users:write permission" })
  @ApiResponse({ status: 404, description: "User not found" })
  async reactivateUser(@Param("id") id: string): Promise<{ message: string; user: User }> {
    const user = await this.usersService.reactivateUser(+id)
    return {
      message: "User reactivated successfully",
      user,
    }
  }

  @Put(":id/roles")
  @Permissions("users:write")
  @ApiOperation({ summary: "Assign roles to a user (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Roles assigned successfully",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden - Requires users:write permission" })
  @ApiResponse({ status: 404, description: "User or role not found" })
  async assignRoles(@Param("id") id: string, @Body() assignRolesDto: AssignRolesDto): Promise<{ user: User }> {
    const user = await this.usersService.assignRoles(+id, assignRolesDto)
    return { user }
  }

  @Post(":id/send-email")
  @HttpCode(HttpStatus.OK)
  @Permissions("users:write")
  @ApiOperation({ summary: "Send email to a user (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Email sent successfully",
  })
  @ApiResponse({ status: 400, description: "Failed to send email" })
  @ApiResponse({ status: 403, description: "Forbidden - Requires users:write permission" })
  @ApiResponse({ status: 404, description: "User not found" })
  async sendEmail(@Param("id") id: string, @Body() sendEmailDto: SendEmailDto): Promise<{ message: string }> {
    await this.usersService.sendEmailToUser(+id, sendEmailDto)
    return {
      message: "Email sent successfully",
    }
  }
}
