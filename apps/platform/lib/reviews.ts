import type { Review } from "./types"

// Sample reviews data for products
export const reviews: Review[] = [
  // Minimalist Watch reviews
  {
    id: "r1",
    productId: "1",
    userId: "u1",
    userName: "Sarah Johnson",
    rating: 5,
    comment:
      "Absolutely love this watch! The minimalist design is perfect and the leather strap is very comfortable. Worth every penny.",
    createdAt: "2024-12-15T10:30:00Z",
    helpful: 12,
  },
  {
    id: "r2",
    productId: "1",
    userId: "u2",
    userName: "Michael Chen",
    rating: 4,
    comment:
      "Great quality watch. The only minor issue is that the strap took a few days to break in, but now it's perfect.",
    createdAt: "2024-12-10T14:20:00Z",
    helpful: 8,
  },
  {
    id: "r3",
    productId: "1",
    userId: "u3",
    userName: "Emma Davis",
    rating: 5,
    comment: "Elegant and timeless design. Received many compliments!",
    createdAt: "2024-12-05T09:15:00Z",
    helpful: 5,
  },
  // Leather Backpack reviews
  {
    id: "r4",
    productId: "3",
    userId: "u4",
    userName: "David Wilson",
    rating: 5,
    comment:
      "This backpack is incredible! The leather quality is outstanding and it fits my 15-inch laptop perfectly. Highly recommend!",
    createdAt: "2024-12-18T16:45:00Z",
    helpful: 15,
  },
  {
    id: "r5",
    productId: "3",
    userId: "u5",
    userName: "Lisa Anderson",
    rating: 4,
    comment: "Beautiful backpack with plenty of space. A bit heavy when fully loaded, but the quality makes up for it.",
    createdAt: "2024-12-12T11:30:00Z",
    helpful: 7,
  },
  // Smart Fitness Tracker reviews
  {
    id: "r6",
    productId: "4",
    userId: "u6",
    userName: "James Martinez",
    rating: 5,
    comment:
      "Best fitness tracker I've owned! Accurate tracking, long battery life, and the app is very user-friendly.",
    createdAt: "2024-12-20T08:00:00Z",
    helpful: 20,
  },
  {
    id: "r7",
    productId: "4",
    userId: "u7",
    userName: "Rachel Kim",
    rating: 5,
    comment: "Love tracking my workouts with this! The heart rate monitor is very accurate.",
    createdAt: "2024-12-14T13:25:00Z",
    helpful: 9,
  },
  {
    id: "r8",
    productId: "4",
    userId: "u8",
    userName: "Tom Brown",
    rating: 4,
    comment: "Great device overall. Sleep tracking could be more detailed, but everything else is excellent.",
    createdAt: "2024-12-08T19:40:00Z",
    helpful: 6,
  },
  // Running Shoes reviews
  {
    id: "r9",
    productId: "8",
    userId: "u9",
    userName: "Amanda White",
    rating: 5,
    comment: "These shoes are amazing! Super comfortable for long runs and the cushioning is perfect.",
    createdAt: "2024-12-19T07:30:00Z",
    helpful: 18,
  },
  {
    id: "r10",
    productId: "8",
    userId: "u10",
    userName: "Chris Taylor",
    rating: 5,
    comment: "Best running shoes I've ever had. Lightweight and great support!",
    createdAt: "2024-12-11T15:50:00Z",
    helpful: 11,
  },
  // Programming Book reviews
  {
    id: "r11",
    productId: "9",
    userId: "u11",
    userName: "Alex Thompson",
    rating: 5,
    comment: "Comprehensive and well-written. Perfect for both beginners and experienced developers.",
    createdAt: "2024-12-16T12:00:00Z",
    helpful: 14,
  },
  {
    id: "r12",
    productId: "9",
    userId: "u12",
    userName: "Nina Patel",
    rating: 4,
    comment: "Great content with practical examples. Would have liked more advanced topics covered.",
    createdAt: "2024-12-09T10:20:00Z",
    helpful: 8,
  },
]

export function getReviewsByProductId(productId: string | number): Review[] {
  const id = productId.toString()
  return reviews
    .filter((review) => review.productId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getAverageRating(productId: string | number): number {
  const productReviews = getReviewsByProductId(productId)
  if (productReviews.length === 0) return 0
  const sum = productReviews.reduce((acc, review) => acc + review.rating, 0)
  return sum / productReviews.length
}

export function getReviewCount(productId: string | number): number {
  return getReviewsByProductId(productId).length
}
