export interface Currency {
  code: string
  name: string
  symbol: string
  country: string
  countryCode: string
  flag: string
  rate: number // Exchange rate relative to USD
  decimals: number
}

export const currencies: Currency[] = [
  {
    code: "RWF",
    name: "Rwandan Franc",
    symbol: "FRw",
    country: "Rwanda",
    countryCode: "RW",
    flag: "🇷🇼",
    rate: 1300,
    decimals: 0,
  },
  // {
  //   code: "EUR",
  //   name: "Euro",
  //   symbol: "€",
  //   country: "European Union",
  //   countryCode: "EU",
  //   flag: "🇪🇺",
  //   rate: 0.92,
  //   decimals: 2,
  // },
  // {
  //   code: "GBP",
  //   name: "British Pound",
  //   symbol: "£",
  //   country: "United Kingdom",
  //   countryCode: "GB",
  //   flag: "🇬🇧",
  //   rate: 0.79,
  //   decimals: 2,
  // },
  // {
  //   code: "KES",
  //   name: "Kenyan Shilling",
  //   symbol: "KSh",
  //   country: "Kenya",
  //   countryCode: "KE",
  //   flag: "🇰🇪",
  //   rate: 129,
  //   decimals: 0,
  // },
  // {
  //   code: "UGX",
  //   name: "Ugandan Shilling",
  //   symbol: "USh",
  //   country: "Uganda",
  //   countryCode: "UG",
  //   flag: "🇺🇬",
  //   rate: 3700,
  //   decimals: 0,
  // },
  // {
  //   code: "TZS",
  //   name: "Tanzanian Shilling",
  //   symbol: "TSh",
  //   country: "Tanzania",
  //   countryCode: "TZ",
  //   flag: "🇹🇿",
  //   rate: 2500,
  //   decimals: 0,
  // },
]

export const getCurrencyByCode = (code: string): Currency => {
  return currencies.find((c) => c.code === code) || currencies[0]
}

export const convertPrice = (priceInUSD: number, targetCurrency: Currency): number => {
  return priceInUSD * targetCurrency.rate
}

export const formatPrice = (price: number | string, currencyCode: string): string => {
  const currency = getCurrencyByCode(currencyCode)
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  const formatted = numericPrice.toFixed(currency.decimals)

  // Format with thousands separator
  const parts = formatted.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  const formattedNumber = parts.join(".")

  return `${currency.symbol}${formattedNumber}`
}

/**
 * Get default maximum price for filters based on currency
 * Returns a reasonable upper limit for price range filters
 */
export const getDefaultMaxPrice = (currencyCode: string): number => {
  const currency = getCurrencyByCode(currencyCode)

  // Base max price in USD is $100
  const baseMaxUSD = 100

  // Convert to target currency
  return Math.round(baseMaxUSD * currency.rate)
}

/**
 * Get price range step based on currency
 * Returns appropriate step value for price sliders
 */
export const getPriceStep = (currencyCode: string): number => {
  const currency = getCurrencyByCode(currencyCode)

  // For currencies with no decimals and high rates, use larger steps
  if (currency.decimals === 0 && currency.rate >= 1000) {
    return 1000 // RWF, UGX, TZS
  } else if (currency.decimals === 0 && currency.rate >= 100) {
    return 100 // KES
  } else {
    return 10 // USD, EUR, GBP
  }
}
