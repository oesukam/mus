"use client"

import type React from "react"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Product } from "@/lib/types"
import { useCartStore } from "@/lib/cart-store"
import { useToast } from "@/hooks/use-toast"
import { WishlistButton } from "@/components/wishlist-button"
import { StarRating } from "@/components/star-rating"
import { getAverageRating, getReviewCount } from "@/lib/reviews"
import { formatPrice } from "@/lib/currencies"
import { getProductImageUrl } from "@/lib/products-api"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const items = useCartStore((state) => state.items)
  const { toast } = useToast()

  // Find quantity already in cart
  const cartItem = items.find((item) => item.id === product.id)
  const quantityInCart = cartItem?.quantity || 0
  const remainingStock = product.stockQuantity - quantityInCart

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()

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

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5
  const isOutOfStock = !product.stockQuantity
  const hasDiscount = Number(product.discountPercentage) > 0
  const discountedPrice = product.discountedPrice

  const averageRating = getAverageRating(product.id)
  const reviewCount = getReviewCount(product.id)

  // Use thumbnail for product cards for better performance
  const imageUrl = getProductImageUrl(product, "thumbnail")

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group border-border hover:border-foreground transition-colors h-full flex flex-col rounded-xl overflow-hidden p-0">
        <div className="relative aspect-[4/3] bg-secondary rounded-t-xl overflow-hidden">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 z-10">
            <WishlistButton
              product={product}
              className="bg-card/80 backdrop-blur-sm hover:bg-card"
            />
          </div>
          {product.isNew && !isOutOfStock && (
            <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold rounded">
              NEW
            </div>
          )}
          {isLowStock && !product.isNew && !hasDiscount && (
            <div className="absolute top-3 left-3 bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold rounded">
              Only {product.stockQuantity} left
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute top-3 left-3 bg-foreground text-background px-3 py-1 text-xs font-semibold rounded">
              Out of Stock
            </div>
          )}
        </div>
        <CardContent className="pt-3 px-4 pb-4 flex flex-col flex-grow">
          <div className="mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              {product.category}
            </p>
            <h3 className="text-lg font-semibold text-foreground mt-1 text-balance">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <StarRating rating={averageRating} size="sm" />
              {reviewCount > 0 && (
                <span className="text-xs text-muted-foreground">({reviewCount})</span>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow">
            {product.description}
          </p>
          <div className={isOutOfStock ? "mb-3 mt-2" : "mb-2"}>
            {!isOutOfStock && (
              <p className="text-xs text-muted-foreground">
                {isLowStock ? (
                  <span className="text-accent font-medium">
                    Low stock - only {product.stockQuantity} left
                  </span>
                ) : (
                  <span className="text-foreground/60">
                    In stock ({product.stockQuantity} available)
                  </span>
                )}
              </p>
            )}
            {isOutOfStock && (
              <p className="text-xs text-muted-foreground font-medium">Currently unavailable</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              {hasDiscount && (
                <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded w-fit">
                  -{product.discount}% OFF
                </span>
              )}
              <div className="flex items-center gap-2">
                {hasDiscount ? (
                  <>
                    <span className="text-lg font-bold text-destructive">
                      {formatPrice(discountedPrice, product.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.price, product.currency)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-foreground">
                    {formatPrice(product.price, product.currency)}
                  </span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="gap-2"
              disabled={isOutOfStock || remainingStock <= 0}
            >
              <ShoppingCart className="h-4 w-4" />
              {isOutOfStock ? "Unavailable" : remainingStock <= 0 ? "Max in Cart" : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
