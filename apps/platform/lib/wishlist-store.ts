import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Product } from "./types"

interface WishlistStore {
  items: Product[]
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  clearWishlist: () => void
  getTotalItems: () => number
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          const exists = state.items.find((item) => item.id === product.id)
          if (exists) {
            return state
          }
          return { items: [...state.items, product] }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),
      isInWishlist: (productId) => {
        const { items } = get()
        return items.some((item) => item.id === productId)
      },
      clearWishlist: () => set({ items: [] }),
      getTotalItems: () => {
        const { items } = get()
        return items.length
      },
    }),
    {
      name: "wishlist-storage",
    },
  ),
)
