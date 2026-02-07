import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface GuestShippingAddress {
  recipientName: string
  phone?: string
  email: string
  address: string
  city: string
  state?: string
  zipCode?: string
  country: string
}

interface GuestAddressStore {
  savedAddress: GuestShippingAddress | null
  saveAddress: (address: GuestShippingAddress) => void
  clearAddress: () => void
  hasAddress: () => boolean
}

export const useGuestAddressStore = create<GuestAddressStore>()(
  persist(
    (set, get) => ({
      savedAddress: null,

      saveAddress: (address: GuestShippingAddress) => {
        set({ savedAddress: address })
      },

      clearAddress: () => {
        set({ savedAddress: null })
      },

      hasAddress: () => {
        return get().savedAddress !== null
      },
    }),
    {
      name: "guest-address-storage",
    },
  ),
)
