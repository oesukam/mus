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
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsQueryDto } from './dto/vendors-query.dto';
import { VendorResponseDto, VendorsResponseDto } from './dto/vendor-response.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('admin / vendors')
@ApiBearerAuth('JWT-auth')
@Controller('admin/vendors')
@UseGuards(PermissionsGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @Permissions('vendors:write')
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({ status: 201, description: 'Vendor created successfully', type: VendorResponseDto })
  @ApiResponse({ status: 409, description: 'Vendor already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires vendors:write permission' })
  async create(@Body() createVendorDto: CreateVendorDto) {
    const vendor = await this.vendorsService.create(createVendorDto);
    return { vendor: VendorResponseDto.fromEntity(vendor) };
  }

  @Get()
  @Permissions('vendors:read')
  @ApiOperation({ summary: 'Get all vendors with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Returns paginated vendors', type: VendorsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires vendors:read permission' })
  async findAll(@Query() queryDto: VendorsQueryDto) {
    const result = await this.vendorsService.findAll(queryDto);
    return {
      vendors: result.vendors.map(VendorResponseDto.fromEntity),
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

  @Get('active')
  @Permissions('vendors:read')
  @ApiOperation({ summary: 'Get all active vendors' })
  @ApiResponse({ status: 200, description: 'Returns active vendors', type: [VendorResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires vendors:read permission' })
  async getActiveVendors() {
    const vendors = await this.vendorsService.getActiveVendors();
    return { vendors: vendors.map(VendorResponseDto.fromEntity) };
  }

  @Get('country/:country')
  @Permissions('vendors:read')
  @ApiOperation({ summary: 'Get vendors by country' })
  @ApiResponse({ status: 200, description: 'Returns vendors for the specified country', type: [VendorResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires vendors:read permission' })
  async getVendorsByCountry(@Param('country') country: string) {
    const vendors = await this.vendorsService.getVendorsByCountry(country);
    return { vendors: vendors.map(VendorResponseDto.fromEntity) };
  }

  @Get(':id')
  @Permissions('vendors:read')
  @ApiOperation({ summary: 'Get a vendor by ID' })
  @ApiResponse({ status: 200, description: 'Returns the vendor', type: VendorResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires vendors:read permission' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const vendor = await this.vendorsService.findOne(id);
    return { vendor: VendorResponseDto.fromEntity(vendor) };
  }

  @Put(':id')
  @Permissions('vendors:write')
  @ApiOperation({ summary: 'Update a vendor' })
  @ApiResponse({ status: 200, description: 'Vendor updated successfully', type: VendorResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @ApiResponse({ status: 409, description: 'Vendor with name or email already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires vendors:write permission' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateVendorDto: UpdateVendorDto) {
    const vendor = await this.vendorsService.update(id, updateVendorDto);
    return { vendor: VendorResponseDto.fromEntity(vendor) };
  }

  @Patch(':id/toggle-status')
  @Permissions('vendors:write')
  @ApiOperation({ summary: 'Toggle vendor active status' })
  @ApiResponse({ status: 200, description: 'Vendor status toggled successfully', type: VendorResponseDto })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires vendors:write permission' })
  async toggleActiveStatus(@Param('id', ParseIntPipe) id: number) {
    const vendor = await this.vendorsService.toggleActiveStatus(id);
    return { vendor: VendorResponseDto.fromEntity(vendor) };
  }

  @Delete(':id')
  @Permissions('vendors:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a vendor' })
  @ApiResponse({ status: 200, description: 'Vendor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - requires vendors:delete permission' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.vendorsService.remove(id);
    return { message: 'Vendor deleted successfully' };
  }
}
