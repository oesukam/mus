import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format price with currency symbol and optional decimals
 * Only shows decimals if they are not zero
 * @param price - The price to format
 * @param currency - The currency code (default: USD)
 * @returns Formatted price string (e.g., "$10" or "$10.50")
 */
export function formatPrice(price: number | string, currency: string = "USD"): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price

  if (isNaN(numPrice)) return "—"

  // Currency symbols mapping
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    AUD: "A$",
    CAD: "C$",
    RWF: "FRw",
    UGX: "USh",
    KES: "KSh",
    // Add more as needed
  }

  const symbol = currencySymbols[currency] || currency

  // Check if price has decimals
  const hasDecimals = numPrice % 1 !== 0

  // Format with thousand separators
  const formattedNumber = hasDecimals
    ? numPrice.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : numPrice.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })

  return `${symbol}${formattedNumber}`
}

/**
 * Format date to a readable string
 * @param date - The date to format (Date object or ISO string)
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) return "—"

  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
