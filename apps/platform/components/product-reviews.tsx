"use client"

import type React from "react"

import { useState } from "react"
import { Star, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/star-rating"
import type { Review } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ProductReviewsProps {
  productId: string | number
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ProductReviews({ productId, reviews, averageRating, totalReviews }: ProductReviewsProps) {
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "helpful">("recent")
  const { toast } = useToast()

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (newRating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      })
      return
    }
    if (newComment.trim().length < 10) {
      toast({
        title: "Comment too short",
        description: "Please write at least 10 characters in your review.",
        variant: "destructive",
      })
      return
    }

    // In a real app, this would use the authenticated user's information
    toast({
      title: "Review submitted!",
      description: "Thank you for your feedback. Your review will appear shortly.",
    })
    setNewRating(0)
    setNewComment("")
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    } else if (sortBy === "highest") {
      return b.rating - a.rating
    } else {
      return b.helpful - a.helpful
    }
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="flex items-center gap-8 pb-6 border-b">
        <div className="text-center">
          <div className="text-5xl font-bold text-foreground mb-2">{averageRating.toFixed(1)}</div>
          <StarRating rating={averageRating} size="lg" />
          <p className="text-sm text-muted-foreground mt-2">{totalReviews} reviews</p>
        </div>
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter((r) => r.rating === stars).length
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
            return (
              <div key={stars} className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground w-8">{stars}</span>
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: `${percentage}%` }} />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Write a Review */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <Label htmlFor="rating">
                Your Rating <span className="text-destructive">*</span>
              </Label>
              <div className="mt-2">
                <StarRating rating={newRating} size="lg" interactive onRatingChange={setNewRating} />
              </div>
              {newRating === 0 && <p className="text-sm text-muted-foreground mt-1">Please select a rating</p>}
            </div>

            <div>
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                placeholder="Share your experience with this product..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>

            <Button type="submit" disabled={newRating === 0}>
              Submit Review
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
          <div className="flex gap-2">
            <Button variant={sortBy === "recent" ? "default" : "outline"} size="sm" onClick={() => setSortBy("recent")}>
              Most Recent
            </Button>
            <Button
              variant={sortBy === "highest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("highest")}
            >
              Highest Rated
            </Button>
            <Button
              variant={sortBy === "helpful" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("helpful")}
            >
              Most Helpful
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{review.userName}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">{review.comment}</p>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Helpful ({review.helpful})
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
