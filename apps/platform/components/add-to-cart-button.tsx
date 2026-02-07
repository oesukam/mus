"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"
import { useCartStore } from "@/lib/cart-store"
import { useToast } from "@/hooks/use-toast"

interface AddToCartButtonProps {
  product: Product
  className?: string
}

export function AddToCartButton({ product, className }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem)
  const items = useCartStore((state) => state.items)
  const { toast } = useToast()

  // Find quantity already in cart
  const cartItem = items.find((item) => item.id === product.id)
  const quantityInCart = cartItem?.quantity || 0
  const remainingStock = product.stockQuantity - quantityInCart

  const handleAddToCart = () => {
    if (product.stockQuantity === 0) {
      toast({
        title: "Out of stock",
        description: "This product is currently unavailable.",
        variant: "destructive",
      })
      return
    }

    if (remainingStock <= 0) {
      toast({
        title: "Cannot add more",
        description: `You already have ${quantityInCart} ${quantityInCart === 1 ? "item" : "items"} in your cart. No more stock available.`,
        variant: "destructive",
      })
      return
    }

    addItem(product)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  // Determine button text and state
  const getButtonText = () => {
    if (product.stockQuantity === 0) {
      return "Out of Stock"
    }
    if (remainingStock <= 0) {
      return `Max in Cart (${quantityInCart})`
    }
    if (quantityInCart > 0) {
      return `Add to Cart (${remainingStock} left)`
    }
    return "Add to Cart"
  }

  const isDisabled = product.stockQuantity === 0 || remainingStock <= 0

  return (
    <Button
      size="lg"
      onClick={handleAddToCart}
      disabled={isDisabled}
      className={className || "w-full gap-2"}
    >
      <ShoppingCart className="h-5 w-5" />
      {getButtonText()}
    </Button>
  )
}
