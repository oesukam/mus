import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { SyncCartDto } from './dto/sync-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Get or create cart for a user
   */
  async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.product.coverImage'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId, items: [] });
      cart = await this.cartRepository.save(cart);
    }

    // Filter out items where product is null (deleted products)
    if (cart.items) {
      const itemsWithoutProduct = cart.items.filter((item) => !item.product);

      // Remove cart items that reference deleted products
      if (itemsWithoutProduct.length > 0) {
        await this.cartItemRepository.remove(itemsWithoutProduct);
        // Reload cart to get updated items list
        cart = await this.cartRepository.findOne({
          where: { userId },
          relations: ['items', 'items.product', 'items.product.coverImage'],
        });
      }

      // Filter to only return items with valid products
      cart.items = cart.items?.filter((item) => item.product) || [];
    }

    return cart;
  }

  /**
   * Get user's cart
   */
  async getCart(userId: number): Promise<Cart> {
    return this.getOrCreateCart(userId);
  }

  /**
   * Add item to cart or update quantity if it already exists
   */
  async addToCart(userId: number, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;

    // Verify product exists and is available
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stockQuantity}, Requested: ${quantity}`,
      );
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = cart.items.find((item) => item.productId === productId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (product.stockQuantity < newQuantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${product.stockQuantity}, In cart: ${existingItem.quantity}, Requested: ${quantity}`,
        );
      }

      existingItem.quantity = newQuantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      // Create new cart item
      const cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        quantity,
      });
      await this.cartItemRepository.save(cartItem);
    }

    // Return updated cart
    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    userId: number,
    itemId: number,
    updateDto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    // Verify stock availability
    const product = await this.productRepository.findOne({
      where: { id: cartItem.productId },
    });

    if (product && product.stockQuantity < updateDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stockQuantity}, Requested: ${updateDto.quantity}`,
      );
    }

    cartItem.quantity = updateDto.quantity;
    await this.cartItemRepository.save(cartItem);

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(userId: number, itemId: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    const cartItem = cart.items.find((item) => item.id === itemId);

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    await this.cartItemRepository.remove(cartItem);

    return this.getCart(userId);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: number): Promise<void> {
    const cart = await this.getCart(userId);

    if (cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }
  }

  /**
   * Sync cart from frontend (merge or replace)
   * This is useful when user logs in with items in their local cart
   */
  async syncCart(userId: number, syncCartDto: SyncCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);

    // Clear existing cart items
    if (cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    // Add all items from sync request
    for (const item of syncCartDto.items) {
      // Verify product exists
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product || !product.isActive) {
        continue; // Skip unavailable products
      }

      // Cap quantity at available stock
      const quantity = Math.min(item.quantity, product.stockQuantity);

      if (quantity > 0) {
        const cartItem = this.cartItemRepository.create({
          cartId: cart.id,
          productId: item.productId,
          quantity,
        });
        await this.cartItemRepository.save(cartItem);
      }
    }

    // Return updated cart
    return this.getCart(userId);
  }
}
