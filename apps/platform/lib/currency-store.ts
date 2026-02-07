import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getCurrencyByCode, type Currency } from "./currencies"

interface CurrencyStore {
  currency: Currency
  setCurrency: (currencyCode: string) => void
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: getCurrencyByCode("RWF"),
      setCurrency: (currencyCode: string) => {
        const currency = getCurrencyByCode(currencyCode)
        set({ currency })
      },
    }),
    {
      name: "currency-storage",
    },
  ),
)
