// ============================================================================
// CURRENCY ENUMS
// ============================================================================

export enum Currency {
  USD = 'USD', // US Dollar
  EUR = 'EUR', // Euro
  GBP = 'GBP', // British Pound
  JPY = 'JPY', // Japanese Yen
  CNY = 'CNY', // Chinese Yuan
  AUD = 'AUD', // Australian Dollar
  CAD = 'CAD', // Canadian Dollar
  CHF = 'CHF', // Swiss Franc
  INR = 'INR', // Indian Rupee
  RUB = 'RUB', // Russian Ruble
  BRL = 'BRL', // Brazilian Real
  KRW = 'KRW', // South Korean Won
  MXN = 'MXN', // Mexican Peso
  ZAR = 'ZAR', // South African Rand
  SGD = 'SGD', // Singapore Dollar
  HKD = 'HKD', // Hong Kong Dollar
  NOK = 'NOK', // Norwegian Krone
  SEK = 'SEK', // Swedish Krona
  DKK = 'DKK', // Danish Krone
  PLN = 'PLN', // Polish Zloty
  THB = 'THB', // Thai Baht
  IDR = 'IDR', // Indonesian Rupiah
  MYR = 'MYR', // Malaysian Ringgit
  PHP = 'PHP', // Philippine Peso
  TRY = 'TRY', // Turkish Lira
  AED = 'AED', // UAE Dirham
  SAR = 'SAR', // Saudi Riyal
  NGN = 'NGN', // Nigerian Naira
  EGP = 'EGP', // Egyptian Pound
  KES = 'KES', // Kenyan Shilling
  RWF = 'RWF', // Rwandan Franc
  CDF = 'CDF', // Congolese Franc
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.GBP]: '£',
  [Currency.JPY]: '¥',
  [Currency.CNY]: '¥',
  [Currency.AUD]: 'A$',
  [Currency.CAD]: 'C$',
  [Currency.CHF]: 'CHF',
  [Currency.INR]: '₹',
  [Currency.RUB]: '₽',
  [Currency.BRL]: 'R$',
  [Currency.KRW]: '₩',
  [Currency.MXN]: 'Mex$',
  [Currency.ZAR]: 'R',
  [Currency.SGD]: 'S$',
  [Currency.HKD]: 'HK$',
  [Currency.NOK]: 'kr',
  [Currency.SEK]: 'kr',
  [Currency.DKK]: 'kr',
  [Currency.PLN]: 'zł',
  [Currency.THB]: '฿',
  [Currency.IDR]: 'Rp',
  [Currency.MYR]: 'RM',
  [Currency.PHP]: '₱',
  [Currency.TRY]: '₺',
  [Currency.AED]: 'د.إ',
  [Currency.SAR]: 'ر.س',
  [Currency.NGN]: '₦',
  [Currency.EGP]: 'E£',
  [Currency.KES]: 'KSh',
  [Currency.RWF]: 'FRw',
  [Currency.CDF]: 'FC',
};

// ============================================================================
// CURRENCY HELPER FUNCTIONS
// ============================================================================

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

export function formatPrice(amount: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);

  // For currencies that typically don't use decimals
  if ([Currency.JPY, Currency.KRW, Currency.IDR, Currency.RWF, Currency.CDF].includes(currency)) {
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  }

  return `${symbol}${amount.toFixed(2).toLocaleString()}`;
}
