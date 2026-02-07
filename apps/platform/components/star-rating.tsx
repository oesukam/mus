"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showNumber?: boolean
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showNumber = false,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1
          const isFilled = starValue <= Math.floor(rating)
          const isPartial = starValue === Math.ceil(rating) && rating % 1 !== 0
          const fillPercentage = isPartial ? (rating % 1) * 100 : 0

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(starValue)}
              disabled={!interactive}
              className={cn(
                "relative",
                interactive && "cursor-pointer hover:scale-110 transition-transform",
                !interactive && "cursor-default",
              )}
            >
              {isPartial ? (
                <div className="relative">
                  <Star className={cn(sizeClasses[size], "text-muted-foreground")} />
                  <div className="absolute top-0 left-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
                    <Star className={cn(sizeClasses[size], "fill-yellow-500 text-yellow-500")} />
                  </div>
                </div>
              ) : (
                <Star
                  className={cn(
                    sizeClasses[size],
                    isFilled ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground",
                  )}
                />
              )}
            </button>
          )
        })}
      </div>
      {showNumber && <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>}
    </div>
  )
}
