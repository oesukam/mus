/**
 * Cart API Service
 * Handles cart operations with the backend API for authenticated users
 */

import { apiClient } from "./api-client"
import type { Product } from "./types"

export interface CartItem {
  id: number
  cartId: number
  productId: number
  quantity: number
  product: Product
  createdAt: string
  updatedAt: string
}

export interface Cart {
  id: number
  userId: number
  items: CartItem[]
  createdAt: string
  updatedAt: string
}

export interface CartResponse {
  cart: Cart
  message?: string
}

/**
 * Get user's cart
 */
export async function getCart(): Promise<Cart> {
  const response = await apiClient.get<CartResponse>("/cart")
  return response.cart
}

/**
 * Add item to cart or update quantity if it already exists
 */
export async function addToCart(productId: number, quantity: number = 1): Promise<Cart> {
  const response = await apiClient.post<CartResponse>("/cart/items", {
    productId,
    quantity,
  })
  return response.cart
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  const response = await apiClient.patch<CartResponse>(`/cart/items/${itemId}`, {
    quantity,
  })
  return response.cart
}

/**
 * Remove item from cart
 */
export async function removeCartItem(itemId: number): Promise<Cart> {
  const response = await apiClient.delete<CartResponse>(`/cart/items/${itemId}`)
  return response.cart
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<void> {
  await apiClient.delete("/cart")
}

/**
 * Sync cart from frontend (useful when user logs in with items in local storage)
 */
export async function syncCart(items: Array<{ productId: number; quantity: number }>): Promise<Cart> {
  const response = await apiClient.post<CartResponse>("/cart/sync", {
    items,
  })
  return response.cart
}

/**
 * Get total items count in cart
 */
export function getCartItemsCount(cart: Cart | null): number {
  if (!cart || !cart.items) return 0
  return cart.items.reduce((total, item) => total + item.quantity, 0)
}

/**
 * Get cart total price
 */
export function getCartTotal(cart: Cart | null): number {
  if (!cart || !cart.items) return 0
  return cart.items.reduce((total, item) => {
    const price = item.product.price
    const discount = item.product.discountPercentage || 0
    const discountedPrice = price * (1 - discount / 100)
    return total + discountedPrice * item.quantity
  }, 0)
}

/**
 * Check if a product is in the cart
 */
export function isProductInCart(cart: Cart | null, productId: number): boolean {
  if (!cart || !cart.items) return false
  return cart.items.some((item) => item.productId === productId)
}

/**
 * Get cart item by product ID
 */
export function getCartItemByProductId(cart: Cart | null, productId: number): CartItem | undefined {
  if (!cart || !cart.items) return undefined
  return cart.items.find((item) => item.productId === productId)
}
