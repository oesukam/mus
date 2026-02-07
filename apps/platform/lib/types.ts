export interface ProductImage {
  id: number
  url: string
  urlThumbnail?: string
  urlMedium?: string
  urlLarge?: string
  mimeType?: string
  originalName: string
  title?: string
  order: number
  isPrimary: boolean
}

export interface Product {
  id: number
  slug: string // Added slug field for SEO-friendly URLs
  name: string
  summary?: string // Brief summary for product cards
  description: string
  price: number
  currency: string
  country?: string
  vatPercentage?: number
  shippingRatePerKm?: number
  weightInKg?: number
  discount: number
  discountPercentage: number
  discountedPrice: number
  image: string // Main cover image URL
  images?: ProductImage[] // Array of product images with multiple sizes
  coverImage?: {
    url: string
    urlThumbnail?: string
    urlMedium?: string
    urlLarge?: string
    mimeType?: string
  }
  category: string
  type?: string // Added product type/subcategory field
  stockQuantity: number
  stockStatus?: string
  isFeatured?: boolean
  isNew?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface CheckoutFormData {
  email: string
  firstName: string
  lastName: string
  address: string
  city: string
  state: string
  zipCode: string
  paymentMethod: "card" | "mobile_money"
  cardNumber?: string
  expiryDate?: string
  cvv?: string
  mobileProvider?: string
  mobileNumber?: string
}

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

export interface Order {
  id: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  createdAt: string
  shippingAddress: {
    firstName: string
    lastName: string
    address: string
    city: string
    state: string
    zipCode: string
  }
  email: string
  trackingNumber?: string
}

export type NotificationType = "order" | "promotion" | "system" | "wishlist"

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
}

export interface UserSettings {
  notifications: {
    orderUpdates: boolean
    promotions: boolean
    wishlistAlerts: boolean
    newsletter: boolean
  }
  privacy: {
    showProfile: boolean
    shareData: boolean
  }
  preferences: {
    currency: string
    language: string
  }
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  provider: string
  picture?: string
  avatar?: string
  createdAt?: string
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number // 1-5 stars
  comment: string
  createdAt: string
  helpful: number // count of helpful votes
}
