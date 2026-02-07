"use client"

import type React from "react"

import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWishlistStore } from "@/lib/wishlist-store"
import { useToast } from "@/hooks/use-toast"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

interface WishlistButtonProps {
  product: Product
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
}

export function WishlistButton({
  product,
  variant = "ghost",
  size = "icon",
  className,
  showText = false,
}: WishlistButtonProps) {
  const { addItem, removeItem, isInWishlist } = useWishlistStore()
  const { toast } = useToast()
  const inWishlist = isInWishlist(product.id)

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inWishlist) {
      removeItem(product.id)
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      })
    } else {
      addItem(product)
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      })
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleWishlist}
      className={cn(className, inWishlist && "text-red-500 hover:text-red-600")}
    >
      <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
      {showText && <span className="ml-2">{inWishlist ? "Saved" : "Save"}</span>}
    </Button>
  )
}
