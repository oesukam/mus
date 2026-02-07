"use client"

import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCurrencyStore } from "@/lib/currency-store"
import { formatPrice } from "@/lib/currencies"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Helper function to check if item is available for purchase
const isItemAvailable = (item: any) => {
  return (
    item.stockQuantity > 0 && item.stockQuantityStatus !== "out_of_stock" && item.stockQuantityStatus !== "discontinued"
  )
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore()
  const currency = useCurrencyStore((state) => state.currency)

  const totalSavings = items.reduce((sum, item) => {
    if (item.discount && item.discount > 0) {
      const savings = item.price * (item.discount / 100) * item.quantity
      return sum + savings
    }
    return sum
  }, 0)

  // Check if there are any unavailable items in the cart
  const hasUnavailableItems = items.some((item) => !isItemAvailable(item))
  const unavailableItemsCount = items.filter((item) => !isItemAvailable(item)).length

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products to get started</p>
          <Button asChild size="lg">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  const subtotal = getTotalPrice()

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-foreground mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {hasUnavailableItems && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {unavailableItemsCount === 1
                  ? "1 item in your cart is out of stock. Please remove it to proceed with checkout."
                  : `${unavailableItemsCount} items in your cart are out of stock. Please remove them to proceed with checkout.`}
              </AlertDescription>
            </Alert>
          )}

          {items.map((item) => {
            const itemAvailable = isItemAvailable(item)
            const hasDiscount = item.discountPercentage > 0
            const discountedPrice = hasDiscount
              ? item.price * (1 - item.discount! / 100)
              : item.price
            const itemTotal = discountedPrice * item.quantity

            return (
              <Card
                key={item.id}
                className={!itemAvailable ? "border-destructive/50 bg-destructive/5" : ""}
              >
                <CardContent className="p-4">
                  {!itemAvailable && (
                    <div className="mb-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">
                        {item.stockQuantity === 0 ? "Out of Stock" : "Currently Unavailable"}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden bg-secondary">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      {hasDiscount && (
                        <div className="absolute top-1 left-1 bg-destructive text-destructive-foreground px-2 py-0.5 text-xs font-semibold rounded">
                          {item.discount}% OFF
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <Link
                              href={`/products/${item.slug}`}
                              className="text-lg font-semibold text-foreground hover:text-muted-foreground transition-colors"
                            >
                              {item.name}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.category}
                              {item.type && <span className="mx-1">•</span>}
                              {item.type}
                              {!itemAvailable && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span className="text-destructive font-medium">
                                    {item.stockQuantity === 0 ? "Out of Stock" : "Unavailable"}
                                  </span>
                                </>
                              )}
                            </p>
                            {hasDiscount && (
                              <p className="text-xs text-destructive font-medium mt-1">
                                Save{" "}
                                {formatPrice(
                                  item.price * (item.discount! / 100) * item.quantity,
                                  currency.symbol,
                                )}{" "}
                                ({item.discount}% off)
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1 || !itemAvailable}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-transparent"
                            onClick={() =>
                              updateQuantity(item.id, Math.min(item.stockQuantity, item.quantity + 1))
                            }
                            disabled={item.quantity >= item.stockQuantity || !itemAvailable}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          {hasDiscount && (
                            <p className="text-sm text-muted-foreground line-through">
                              {formatPrice(item.price * item.quantity, currency.symbol)}
                            </p>
                          )}
                          <p className="text-lg font-bold text-foreground">
                            {formatPrice(itemTotal, currency.symbol)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-foreground">
                    {formatPrice(subtotal, currency.symbol)}
                  </span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discount Savings</span>
                    <span className="font-medium text-destructive">
                      -{formatPrice(totalSavings, currency.symbol)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-sm text-muted-foreground italic">
                    Calculated at checkout
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-sm text-muted-foreground italic">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <Button
                asChild={!hasUnavailableItems}
                size="lg"
                className="w-full mb-4"
                disabled={hasUnavailableItems}
              >
                {hasUnavailableItems ? (
                  <span>Checkout Unavailable</span>
                ) : (
                  <Link href="/checkout">Proceed to Checkout</Link>
                )}
              </Button>
              {hasUnavailableItems && (
                <p className="text-xs text-center text-destructive font-medium mb-4">
                  Please remove out-of-stock items to continue
                </p>
              )}

              <Button asChild variant="outline" size="lg" className="w-full bg-transparent">
                <Link href="/">Continue Shopping</Link>
              </Button>

              {totalSavings > 0 && (
                <p className="text-xs text-center text-destructive font-medium mt-4">
                  You're saving {formatPrice(totalSavings, currency.symbol)} with discounts!
                </p>
              )}
              <p className="text-xs text-center text-muted-foreground mt-2">
                Shipping and taxes will be calculated at checkout
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
