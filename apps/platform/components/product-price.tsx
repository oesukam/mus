"use client"

import { useCurrencyStore } from "@/lib/currency-store"
import { formatPrice } from "@/lib/currencies"
import { cn } from "@/lib/utils"

interface ProductPriceProps {
  price: number | string
  currency?: string
  className?: string
}

export function ProductPrice({ price, currency: productCurrency, className }: ProductPriceProps) {
  const storeCurrency = useCurrencyStore((state) => state.currency)
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price

  // Use product's currency if available, otherwise fall back to store currency
  const displayCurrency = productCurrency || storeCurrency

  return <p className={cn(className)}>{formatPrice(numericPrice, displayCurrency)}</p>
}
