"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { useWishlistStore } from "@/lib/wishlist-store"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { ProtectedRoute } from "@/components/protected-route"

export default function WishlistPage() {
  const { items } = useWishlistStore()

  if (items.length === 0) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-4">Your wishlist is empty</h1>
            <p className="text-muted-foreground mb-8">Save items you love to buy them later</p>
            <Button asChild size="lg">
              <Link href="/">Start Shopping</Link>
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-foreground">My Wishlist</h1>
        <p className="text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>

        <div className="mt-8 flex justify-center">
          <Button asChild variant="outline" size="lg" className="bg-transparent">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  )
}
