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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { SyncCartDto } from './dto/sync-cart.dto';
import { CartResponse } from './dto/cart-response.dto';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('cart')
@Controller('cart')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
    type: CartResponse,
  })
  async getCart(@Request() req: any) {
    const cart = await this.cartService.getCart(req.user.id);
    return { cart };
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 201,
    description: 'Item added to cart successfully',
    type: CartResponse,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Product unavailable or insufficient stock' })
  async addToCart(@Request() req: any, @Body() addToCartDto: AddToCartDto) {
    const cart = await this.cartService.addToCart(req.user.id, addToCartDto);
    return {
      cart,
      message: 'Item added to cart successfully',
    };
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
    type: CartResponse,
  })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  async updateCartItem(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    const cart = await this.cartService.updateCartItem(req.user.id, id, updateDto);
    return {
      cart,
      message: 'Cart item updated successfully',
    };
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
    type: CartResponse,
  })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeCartItem(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    const cart = await this.cartService.removeCartItem(req.user.id, id);
    return {
      cart,
      message: 'Item removed from cart successfully',
    };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
  })
  async clearCart(@Request() req: any) {
    await this.cartService.clearCart(req.user.id);
    return {
      message: 'Cart cleared successfully',
    };
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Sync cart from frontend',
    description:
      'Replaces backend cart with frontend cart. Useful when user logs in with items in local storage.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart synced successfully',
    type: CartResponse,
  })
  async syncCart(@Request() req: any, @Body() syncCartDto: SyncCartDto) {
    const cart = await this.cartService.syncCart(req.user.id, syncCartDto);
    return {
      cart,
      message: 'Cart synced successfully',
    };
  }
}
