"use client"

import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/cart-store"
import { useAuthStore } from "@/lib/auth-store"
import { CheckoutForm } from "@/components/checkout-form"
import { AuthModal } from "@/components/auth-modal"
import { Card, CardContent } from "@/components/ui/card"
import { ShoppingBag, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState, createContext, useContext } from "react"
import { validateDiscountCode, calculateDiscount } from "@/lib/discount-codes"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCurrencyStore } from "@/lib/currency-store"
import { formatPrice } from "@/lib/currencies"

// Context to share shipping address between form and summary
const ShippingContext = createContext<{
  country: string | null
  city: string | null
  setShippingInfo: (country: string | null, city: string | null) => void
}>({
  country: null,
  city: null,
  setShippingInfo: () => {},
})

export const useShippingContext = () => useContext(ShippingContext)

export default function CheckoutPage() {
  const { items, getTotalPrice, discount, applyDiscount, removeDiscount } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const currency = useCurrencyStore((state) => state.currency)
  const [showAuthModal, setShowAuthModal] = useState(!isAuthenticated)
  const [discountCode, setDiscountCode] = useState("")
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
  const [shippingCountry, setShippingCountry] = useState<string | null>(null)
  const [shippingCity, setShippingCity] = useState<string | null>(null)
  const router = useRouter()

  const setShippingInfo = (country: string | null, city: string | null) => {
    setShippingCountry(country)
    setShippingCity(city)
  }

  const handleApplyDiscount = () => {
    setIsApplyingDiscount(true)
    setDiscountError(null)

    const subtotal = getTotalPrice()
    const validation = validateDiscountCode(discountCode, subtotal)

    if (validation.valid && validation.discount) {
      applyDiscount(validation.discount)
      setDiscountCode("")
    } else {
      setDiscountError(validation.error || "Invalid discount code")
    }

    setIsApplyingDiscount(false)
  }

  const handleRemoveDiscount = () => {
    removeDiscount()
    setDiscountError(null)
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products before checking out</p>
          <Button asChild size="lg">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Guest checkout is now allowed - no authentication check needed

  const subtotal = getTotalPrice()
  const discountAmount = discount ? calculateDiscount(subtotal, discount) : 0
  const subtotalAfterDiscount = subtotal - discountAmount

  // Calculate shipping only after address is provided
  const hasShippingAddress = shippingCountry && shippingCity
  const shipping = hasShippingAddress ? (subtotalAfterDiscount > 100 ? 0 : 9.99) : null
  const vat = subtotalAfterDiscount * 0.18 // 18% VAT
  const total = hasShippingAddress && shipping !== null
    ? subtotalAfterDiscount + shipping + vat
    : subtotalAfterDiscount + vat

  return (
    <ShippingContext.Provider value={{ country: shippingCountry, city: shippingCity, setShippingInfo }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm />
          </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-foreground">{formatPrice(item.price * item.quantity, currency)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="space-y-3">
                  {!discount ? (
                    <>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Discount code"
                            value={discountCode}
                            onChange={(e) => {
                              setDiscountCode(e.target.value.toUpperCase())
                              setDiscountError(null)
                            }}
                            className="pl-9"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleApplyDiscount()
                              }
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleApplyDiscount}
                          disabled={!discountCode || isApplyingDiscount}
                        >
                          Apply
                        </Button>
                      </div>
                      {discountError && (
                        <Alert variant="destructive" className="py-2">
                          <AlertDescription className="text-xs">{discountError}</AlertDescription>
                        </Alert>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-md">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">{discount.code}</p>
                          <p className="text-xs text-green-700 dark:text-green-300">{discount.description}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveDiscount}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">{formatPrice(subtotal, currency)}</span>
                </div>
                {discount && discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">Discount ({discount.code})</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      -{formatPrice(discountAmount, currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  {shipping !== null ? (
                    <span className="font-medium text-foreground">
                      {shipping === 0 ? "Free" : formatPrice(shipping, currency)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Enter address</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">VAT (18%)</span>
                  <span className="font-medium text-foreground">{formatPrice(vat, currency)}</span>
                </div>
                {!hasShippingAddress && (
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground italic">
                      Final total will be calculated after you provide your shipping address
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-foreground">{formatPrice(total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </ShippingContext.Provider>
  )
}
