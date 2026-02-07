import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, Product } from "./types"
import type { DiscountCode } from "./discount-codes"
import { getCurrencyByCode } from "./currencies"
import * as cartApi from "./cart-api"
import type { Cart } from "./cart-api"

interface CartStore {
  items: CartItem[]
  discount: DiscountCode | null
  backendCart: Cart | null
  isLoading: boolean
  isSyncing: boolean
  addItem: (product: Product, isAuthenticated?: boolean) => Promise<void>
  removeItem: (productId: number, isAuthenticated?: boolean) => Promise<void>
  updateQuantity: (productId: number, quantity: number, isAuthenticated?: boolean) => Promise<void>
  clearCart: (isAuthenticated?: boolean) => Promise<void>
  getTotalPrice: () => number
  getTotalItems: () => number
  applyDiscount: (discount: DiscountCode) => void
  removeDiscount: () => void
  syncWithBackend: () => Promise<void>
  loadBackendCart: () => Promise<void>
}

/**
 * Validates and normalizes a cart item to ensure it has all required fields
 * This helps fix cart items that were added before recent schema changes
 */
function normalizeCartItem(item: CartItem): CartItem {
  // Handle currency: convert string to Currency object if needed
  let currency = item.currency
  if (typeof currency === "string") {
    currency = getCurrencyByCode(currency)
  } else if (!currency) {
    currency = getCurrencyByCode("RWF") // Default currency
  }

  return {
    ...item,
    // Ensure discount field exists (map from discountPercentage if needed)
    discount: item.discount ?? item.discountPercentage ?? 0,
    discountPercentage: item.discountPercentage ?? item.discount ?? 0,
    // Ensure slug exists (fallback to empty string if missing)
    slug: item.slug || `product-${item.id}`,
    // Ensure image exists
    image: item.image || item.coverImage?.url || "",
    // Ensure other optional fields have defaults
    summary: item.summary,
    description: item.description || "",
    category: item.category || "Uncategorized",
    stockQuantity: item.stockQuantity ?? 0,
    currency,
  }
}

/**
 * Convert backend cart item to frontend CartItem format
 */
function convertBackendCartItem(backendItem: cartApi.CartItem): CartItem {
  const product = backendItem.product
  return normalizeCartItem({
    ...product,
    quantity: backendItem.quantity,
  })
}

/**
 * Convert backend cart to frontend cart items
 */
function convertBackendCart(backendCart: Cart | null): CartItem[] {
  if (!backendCart || !backendCart.items) return []
  return backendCart.items.map(convertBackendCartItem)
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: null,
      backendCart: null,
      isLoading: false,
      isSyncing: false,

      addItem: async (product, isAuthenticated = false) => {
        if (isAuthenticated) {
          // Add to backend cart
          try {
            set({ isLoading: true })
            const backendCart = await cartApi.addToCart(product.id, 1)
            set({
              backendCart,
              items: convertBackendCart(backendCart),
              isLoading: false,
            })
          } catch (error) {
            console.error("Failed to add item to backend cart:", error)
            set({ isLoading: false })
            // Fallback to local storage
            addItemToLocalStorage(product, set, get)
          }
        } else {
          // Add to local storage
          addItemToLocalStorage(product, set, get)
        }
      },

      removeItem: async (productId, isAuthenticated = false) => {
        if (isAuthenticated) {
          // Remove from backend cart
          try {
            set({ isLoading: true })
            const { backendCart } = get()
            const cartItem = backendCart?.items.find((item) => item.productId === productId)
            if (cartItem) {
              const updatedCart = await cartApi.removeCartItem(cartItem.id)
              set({
                backendCart: updatedCart,
                items: convertBackendCart(updatedCart),
                isLoading: false,
              })
            }
          } catch (error) {
            console.error("Failed to remove item from backend cart:", error)
            set({ isLoading: false })
            // Fallback to local storage
            removeItemFromLocalStorage(productId, set)
          }
        } else {
          // Remove from local storage
          removeItemFromLocalStorage(productId, set)
        }
      },

      updateQuantity: async (productId, quantity, isAuthenticated = false) => {
        if (isAuthenticated) {
          // Update in backend cart
          try {
            set({ isLoading: true })
            const { backendCart } = get()
            const cartItem = backendCart?.items.find((item) => item.productId === productId)
            if (cartItem) {
              const updatedCart = await cartApi.updateCartItem(cartItem.id, quantity)
              set({
                backendCart: updatedCart,
                items: convertBackendCart(updatedCart),
                isLoading: false,
              })
            }
          } catch (error) {
            console.error("Failed to update item in backend cart:", error)
            set({ isLoading: false })
            // Fallback to local storage
            updateQuantityInLocalStorage(productId, quantity, set)
          }
        } else {
          // Update in local storage
          updateQuantityInLocalStorage(productId, quantity, set)
        }
      },

      clearCart: async (isAuthenticated = false) => {
        if (isAuthenticated) {
          // Clear backend cart
          try {
            set({ isLoading: true })
            await cartApi.clearCart()
            set({
              items: [],
              discount: null,
              backendCart: null,
              isLoading: false,
            })
          } catch (error) {
            console.error("Failed to clear backend cart:", error)
            set({ isLoading: false })
            // Fallback to local storage
            set({ items: [], discount: null })
          }
        } else {
          // Clear local storage
          set({ items: [], discount: null })
        }
      },

      getTotalPrice: () => {
        const { items } = get()
        return items.reduce((total, item) => {
          const price = item.price
          const discount = item.discountPercentage || 0
          const discountedPrice = price * (1 - discount / 100)
          return total + discountedPrice * item.quantity
        }, 0)
      },

      getTotalItems: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.quantity, 0)
      },

      applyDiscount: (discount) => set({ discount }),
      removeDiscount: () => set({ discount: null }),

      syncWithBackend: async () => {
        try {
          set({ isSyncing: true })
          const { items } = get()

          if (items.length === 0) {
            set({ isSyncing: false })
            return
          }

          // Sync local cart to backend
          const syncItems = items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          }))

          const backendCart = await cartApi.syncCart(syncItems)
          set({
            backendCart,
            items: convertBackendCart(backendCart),
            isSyncing: false,
          })
        } catch (error) {
          console.error("Failed to sync cart with backend:", error)
          set({ isSyncing: false })
        }
      },

      loadBackendCart: async () => {
        try {
          set({ isLoading: true })
          const backendCart = await cartApi.getCart()
          set({
            backendCart,
            items: convertBackendCart(backendCart),
            isLoading: false,
          })
        } catch (error) {
          console.error("Failed to load backend cart:", error)
          set({ isLoading: false })
        }
      },
    }),
    {
      name: "cart-storage",
      // Only persist local items and discount for guest users
      partialize: (state) => ({
        items: state.items,
        discount: state.discount,
      }),
      // Normalize cart items when hydrating from localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.items) {
          state.items = state.items.map(normalizeCartItem)
        }
      },
    },
  ),
)

// Helper functions for local storage operations
function addItemToLocalStorage(
  product: Product,
  set: (fn: (state: CartStore) => Partial<CartStore>) => void,
  get: () => CartStore,
) {
  set((state) => {
    const normalizedProduct = normalizeCartItem({ ...product, quantity: 1 })
    const existingItem = state.items.find((item) => item.id === product.id)
    if (existingItem) {
      return {
        items: state.items.map((item) =>
          item.id === product.id ? { ...normalizeCartItem(item), quantity: item.quantity + 1 } : item,
        ),
      }
    }
    return { items: [...state.items, normalizedProduct] }
  })
}

function removeItemFromLocalStorage(
  productId: number,
  set: (fn: (state: CartStore) => Partial<CartStore>) => void,
) {
  set((state) => ({
    items: state.items.filter((item) => item.id !== productId),
  }))
}

function updateQuantityInLocalStorage(
  productId: number,
  quantity: number,
  set: (fn: (state: CartStore) => Partial<CartStore>) => void,
) {
  set((state) => ({
    items: state.items.map((item) => (item.id === productId ? { ...item, quantity } : item)),
  }))
}
