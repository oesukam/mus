import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger"
import { ShippingAddressesService } from "./shipping-addresses.service"
import { CreateShippingAddressDto } from "./dto/create-shipping-address.dto"
import { UpdateShippingAddressDto } from "./dto/update-shipping-address.dto"
import {
  ShippingAddressResponseDto,
  ShippingAddressesListResponseDto,
  ShippingAddressDeleteResponseDto,
} from "./dto/shipping-address-response.dto"
import { RolesGuard } from "../auth/guards/roles.guard"

@ApiTags("shipping-addresses")
@Controller("shipping-addresses")
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class ShippingAddressesController {
  constructor(private readonly shippingAddressesService: ShippingAddressesService) {}

  @Get()
  @ApiOperation({ summary: "Get all shipping addresses for current user" })
  @ApiResponse({
    status: 200,
    description: "Shipping addresses retrieved successfully",
    type: ShippingAddressesListResponseDto,
  })
  async findAll(@Request() req: any): Promise<ShippingAddressesListResponseDto> {
    const addresses = await this.shippingAddressesService.findAllByUserId(req.user.id)
    return { addresses }
  }

  @Get("default")
  @ApiOperation({ summary: "Get default shipping address for current user" })
  @ApiResponse({
    status: 200,
    description: "Default shipping address retrieved successfully",
    type: ShippingAddressResponseDto,
  })
  @ApiResponse({ status: 404, description: "No default address found" })
  async findDefault(@Request() req: any): Promise<ShippingAddressResponseDto> {
    const address = await this.shippingAddressesService.findDefaultByUserId(req.user.id)
    return { address }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific shipping address by ID" })
  @ApiParam({ name: "id", description: "Shipping address ID" })
  @ApiResponse({
    status: 200,
    description: "Shipping address retrieved successfully",
    type: ShippingAddressResponseDto,
  })
  @ApiResponse({ status: 404, description: "Shipping address not found" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<ShippingAddressResponseDto> {
    const address = await this.shippingAddressesService.findOne(id, req.user.id)
    return { address }
  }

  @Post()
  @ApiOperation({ summary: "Create a new shipping address" })
  @ApiResponse({
    status: 201,
    description: "Shipping address created successfully",
    type: ShippingAddressResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(
    @Request() req: any,
    @Body() createShippingAddressDto: CreateShippingAddressDto,
  ): Promise<ShippingAddressResponseDto> {
    const address = await this.shippingAddressesService.create(
      req.user.id,
      createShippingAddressDto,
    )
    return {
      address,
      message: "Shipping address created successfully",
    }
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a shipping address" })
  @ApiParam({ name: "id", description: "Shipping address ID" })
  @ApiResponse({
    status: 200,
    description: "Shipping address updated successfully",
    type: ShippingAddressResponseDto,
  })
  @ApiResponse({ status: 404, description: "Shipping address not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
    @Body() updateShippingAddressDto: UpdateShippingAddressDto,
  ): Promise<ShippingAddressResponseDto> {
    const address = await this.shippingAddressesService.update(
      id,
      req.user.id,
      updateShippingAddressDto,
    )
    return {
      address,
      message: "Shipping address updated successfully",
    }
  }

  @Patch(":id/set-default")
  @ApiOperation({ summary: "Set a shipping address as default" })
  @ApiParam({ name: "id", description: "Shipping address ID" })
  @ApiResponse({
    status: 200,
    description: "Shipping address set as default successfully",
    type: ShippingAddressResponseDto,
  })
  @ApiResponse({ status: 404, description: "Shipping address not found" })
  async setAsDefault(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<ShippingAddressResponseDto> {
    const address = await this.shippingAddressesService.setAsDefault(id, req.user.id)
    return {
      address,
      message: "Shipping address set as default successfully",
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a shipping address" })
  @ApiParam({ name: "id", description: "Shipping address ID" })
  @ApiResponse({
    status: 200,
    description: "Shipping address deleted successfully",
    type: ShippingAddressDeleteResponseDto,
  })
  @ApiResponse({ status: 404, description: "Shipping address not found" })
  async remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<ShippingAddressDeleteResponseDto> {
    await this.shippingAddressesService.remove(id, req.user.id)
    return {
      message: "Shipping address deleted successfully",
    }
  }
}
