import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MobilePaymentsService } from './mobile-payments.service';
import { CreateMobilePaymentDto } from './dto/create-mobile-payment.dto';
import { UpdateMobilePaymentDto } from './dto/update-mobile-payment.dto';
import { MobilePayment } from './entities/mobile-payment.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('mobile-payments')
@ApiBearerAuth()
@Controller('mobile-payments')
@UseGuards(JwtAuthGuard)
export class MobilePaymentsController {
  constructor(private readonly mobilePaymentsService: MobilePaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mobile payment method' })
  @ApiResponse({
    status: 201,
    description: 'Mobile payment method created successfully',
    type: MobilePayment,
  })
  async create(
    @Request() req,
    @Body() createDto: CreateMobilePaymentDto,
  ): Promise<MobilePayment> {
    return this.mobilePaymentsService.create(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all mobile payment methods for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of mobile payment methods',
    type: [MobilePayment],
  })
  async findAll(@Request() req): Promise<MobilePayment[]> {
    return this.mobilePaymentsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific mobile payment method' })
  @ApiResponse({
    status: 200,
    description: 'Mobile payment method retrieved successfully',
    type: MobilePayment,
  })
  @ApiResponse({ status: 404, description: 'Mobile payment method not found' })
  async findOne(@Request() req, @Param('id') id: string): Promise<MobilePayment> {
    return this.mobilePaymentsService.findOne(+id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a mobile payment method' })
  @ApiResponse({
    status: 200,
    description: 'Mobile payment method updated successfully',
    type: MobilePayment,
  })
  @ApiResponse({ status: 404, description: 'Mobile payment method not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateMobilePaymentDto,
  ): Promise<MobilePayment> {
    return this.mobilePaymentsService.update(+id, req.user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a mobile payment method' })
  @ApiResponse({ status: 200, description: 'Mobile payment method deleted successfully' })
  @ApiResponse({ status: 404, description: 'Mobile payment method not found' })
  async remove(@Request() req, @Param('id') id: string): Promise<{ message: string }> {
    await this.mobilePaymentsService.remove(+id, req.user.id);
    return { message: 'Mobile payment method deleted successfully' };
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set a mobile payment method as default' })
  @ApiResponse({
    status: 200,
    description: 'Default mobile payment method set successfully',
    type: MobilePayment,
  })
  @ApiResponse({ status: 404, description: 'Mobile payment method not found' })
  async setDefault(@Request() req, @Param('id') id: string): Promise<MobilePayment> {
    return this.mobilePaymentsService.setDefault(+id, req.user.id);
  }
}
