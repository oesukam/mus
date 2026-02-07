import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionsQueryDto } from './dto/permissions-query.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('admin / permissions')
@ApiBearerAuth('JWT-auth')
@Controller('admin/permissions')
@UseGuards(PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Permissions('permissions:write')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully', type: PermissionResponseDto })
  @ApiResponse({ status: 409, description: 'Permission already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:write permission' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    const permission = await this.permissionsService.create(createPermissionDto);
    return { permission };
  }

  @Get()
  @Permissions('permissions:read')
  @ApiOperation({ summary: 'Get all permissions with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated permissions', type: [PermissionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:read permission' })
  async findAll(@Query() queryDto: PermissionsQueryDto) {
    const result = await this.permissionsService.findAll(queryDto);
    return {
      permissions: result.permissions,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
    };
  }

  @Get('resource/:resource')
  @Permissions('permissions:read')
  @ApiOperation({ summary: 'Get permissions by resource' })
  @ApiResponse({ status: 200, description: 'Returns permissions for the resource', type: [PermissionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:read permission' })
  async findByResource(@Param('resource') resource: string) {
    const permissions = await this.permissionsService.findByResource(resource);
    return { permissions };
  }

  @Get(':id')
  @Permissions('permissions:read')
  @ApiOperation({ summary: 'Get a permission by ID' })
  @ApiResponse({ status: 200, description: 'Returns the permission', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:read permission' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const permission = await this.permissionsService.findOne(id);
    return { permission };
  }

  @Put(':id')
  @Permissions('permissions:write')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiResponse({ status: 200, description: 'Permission updated successfully', type: PermissionResponseDto })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 409, description: 'Permission name already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:write permission' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.permissionsService.update(id, updatePermissionDto);
    return { permission };
  }

  @Delete(':id')
  @Permissions('permissions:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiResponse({ status: 204, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:delete permission' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.permissionsService.remove(id);
  }

  @Post('seed')
  @Permissions('permissions:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed default permissions' })
  @ApiResponse({ status: 200, description: 'Default permissions seeded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires permissions:write permission' })
  async seedDefaults() {
    await this.permissionsService.seedDefaultPermissions();
    return { message: 'Default permissions seeded successfully' };
  }
}
