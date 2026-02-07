export interface DiscountCode {
  code: string
  type: "percentage" | "fixed"
  value: number
  description: string
  minPurchase?: number
  expiryDate?: Date
}

export const discountCodes: DiscountCode[] = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    description: "10% off your first order",
    minPurchase: 50,
  },
  {
    code: "SAVE20",
    type: "percentage",
    value: 20,
    description: "20% off orders over $100",
    minPurchase: 100,
  },
  {
    code: "FREESHIP",
    type: "fixed",
    value: 9.99,
    description: "Free shipping on any order",
  },
  {
    code: "FLASH50",
    type: "percentage",
    value: 50,
    description: "50% off flash sale",
    minPurchase: 75,
  },
  {
    code: "SAVE15",
    type: "fixed",
    value: 15,
    description: "$15 off your purchase",
    minPurchase: 60,
  },
]

export function validateDiscountCode(
  code: string,
  subtotal: number,
): { valid: boolean; discount?: DiscountCode; error?: string } {
  const discountCode = discountCodes.find((d) => d.code.toLowerCase() === code.toLowerCase())

  if (!discountCode) {
    return { valid: false, error: "Invalid discount code" }
  }

  if (discountCode.minPurchase && subtotal < discountCode.minPurchase) {
    return {
      valid: false,
      error: `Minimum purchase of $${discountCode.minPurchase} required`,
    }
  }

  if (discountCode.expiryDate && new Date() > discountCode.expiryDate) {
    return { valid: false, error: "This discount code has expired" }
  }

  return { valid: true, discount: discountCode }
}

export function calculateDiscount(subtotal: number, discount: DiscountCode): number {
  if (discount.type === "percentage") {
    return subtotal * (discount.value / 100)
  }
  return discount.value
}
