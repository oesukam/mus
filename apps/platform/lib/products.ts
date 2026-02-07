import type { Product } from "./types"

export const products: Product[] = [
  {
    id: "1",
    slug: "minimalist-watch",
    name: "Minimalist Watch",
    description: "Elegant timepiece with a clean design and premium leather strap",
    price: 299.99,
    discount: 15,
    image: "/minimalist-watch.png",
    images: [
      "/minimalist-watch.png",
      "/minimalist-watch-side-view.jpg",
      "/minimalist-watch-back-view.jpg",
      "/minimalist-watch-on-wrist.jpg",
    ],
    category: "Accessories",
    type: "Watches", // Added product type
    stock: 15,
    featured: true,
    isNew: true,
  },
  {
    id: "2",
    slug: "wireless-headphones",
    name: "Wireless Headphones",
    description: "Premium noise-cancelling headphones with 30-hour battery life",
    price: 349.99,
    image: "/wireless-headphones.png",
    images: [
      "/wireless-headphones.png",
      "/wireless-headphones-side.png",
      "/wireless-headphones-folded.jpg",
      "/wireless-headphones-case.png",
    ],
    category: "Electronics",
    type: "Audio", // Added product type
    stock: 0,
    featured: true,
  },
  {
    id: "3",
    slug: "leather-backpack",
    name: "Leather Backpack",
    description: "Handcrafted leather backpack with laptop compartment",
    price: 189.99,
    discount: 20,
    image: "/brown-leather-backpack.png",
    images: [
      "/brown-leather-backpack.png",
      "/leather-backpack-interior.jpg",
      "/leather-backpack-side.png",
      "/leather-backpack-worn.jpg",
    ],
    category: "Bags",
    type: "Backpacks", // Added product type
    stock: 12,
    featured: true,
    isNew: true,
  },
  {
    id: "4",
    slug: "smart-fitness-tracker",
    name: "Smart Fitness Tracker",
    description: "Track your health and fitness goals with precision",
    price: 129.99,
    discount: 25,
    image: "/fitness-tracker-lifestyle.png",
    images: [
      "/fitness-tracker-lifestyle.png",
      "/fitness-tracker-display.jpg",
      "/fitness-tracker-on-wrist.png",
      "/fitness-tracker-charging.jpg",
    ],
    category: "Electronics",
    type: "Wearables", // Added product type
    stock: 34,
    isNew: true,
  },
  {
    id: "5",
    slug: "ceramic-coffee-mug",
    name: "Ceramic Coffee Mug",
    description: "Handmade ceramic mug perfect for your morning coffee",
    price: 24.99,
    discount: 10,
    image: "/ceramic-coffee-mug.png",
    images: ["/ceramic-coffee-mug.png", "/ceramic-mug-coffee.png", "/ceramic-mug-handle-detail.jpg"],
    category: "Home",
    type: "Kitchen", // Added product type
    stock: 56,
  },
  {
    id: "6",
    slug: "sunglasses",
    name: "Sunglasses",
    description: "UV protection sunglasses with polarized lenses",
    price: 159.99,
    image: "/stylish-sunglasses.png",
    images: ["/stylish-sunglasses.png", "/sunglasses-side-view.png", "/sunglasses-folded.jpg", "/sunglasses-worn.jpg"],
    category: "Accessories",
    type: "Eyewear", // Added product type
    stock: 3,
  },
  {
    id: "7",
    slug: "desk-lamp",
    name: "Desk Lamp",
    description: "Modern LED desk lamp with adjustable brightness",
    price: 79.99,
    image: "/modern-desk-lamp.png",
    images: ["/modern-desk-lamp.png", "/desk-lamp-on.jpg", "/desk-lamp-adjustable.jpg"],
    category: "Home",
    type: "Lighting", // Added product type
    stock: 0,
  },
  {
    id: "8",
    slug: "running-shoes",
    name: "Running Shoes",
    description: "Lightweight running shoes with superior cushioning",
    price: 139.99,
    discount: 30,
    image: "/running-shoes.jpg",
    images: ["/running-shoes.jpg", "/running-shoes-side-view.png", "/running-shoe-sole.png", "/running-shoes-worn.jpg"],
    category: "Sports",
    type: "Footwear", // Changed category to Sports (valid enum value)
    stock: 41,
    isNew: true,
  },
  {
    id: "9",
    slug: "the-art-of-programming",
    name: "The Art of Programming",
    description: "Comprehensive guide to modern software development practices",
    price: 49.99,
    image: "/programming-book.jpg",
    images: ["/programming-book.jpg", "/programming-book-open.jpg", "/programming-book-spine.jpg"],
    category: "Books",
    type: "Technical", // Added product type
    stock: 28,
    featured: true,
  },
  {
    id: "10",
    slug: "mystery-novel-collection",
    name: "Mystery Novel Collection",
    description: "Bestselling mystery novels bundle - 3 books",
    price: 34.99,
    discount: 15,
    image: "/mystery-books.jpg",
    images: ["/mystery-books.jpg", "/mystery-books-stack.jpg"],
    category: "Books",
    type: "Fiction", // Added product type
    stock: 15,
    isNew: true,
  },
  {
    id: "11",
    slug: "cooking-masterclass",
    name: "Cooking Masterclass",
    description: "Professional cooking techniques and recipes",
    price: 39.99,
    image: "/cooking-book.jpg",
    images: ["/cooking-book.jpg", "/cooking-book-recipe.jpg"],
    category: "Books",
    type: "Cooking", // Added product type
    stock: 22,
  },
  {
    id: "12",
    slug: "childrens-adventure-book",
    name: "Children's Adventure Book",
    description: "Illustrated adventure story for ages 6-10",
    price: 19.99,
    image: "/childrens-book.jpg",
    images: ["/childrens-book.jpg", "/childrens-book-illustration.jpg"],
    category: "Books",
    type: "Children's", // Added product type
    stock: 45,
  },
  {
    id: "13",
    slug: "building-blocks-set",
    name: "Building Blocks Set",
    description: "500-piece creative building blocks for kids",
    price: 59.99,
    image: "/building-blocks.jpg",
    images: ["/building-blocks.jpg", "/building-blocks-built.jpg"],
    category: "Toys",
    type: "Building", // Added product type
    stock: 32,
    featured: true,
  },
  {
    id: "14",
    slug: "remote-control-car",
    name: "Remote Control Car",
    description: "High-speed RC car with rechargeable battery",
    price: 79.99,
    image: "/rc-car.jpg",
    images: ["/rc-car.jpg", "/rc-car-action.jpg"],
    category: "Toys",
    type: "Vehicles", // Added product type
    stock: 18,
    isNew: true,
  },
  {
    id: "15",
    slug: "educational-puzzle-set",
    name: "Educational Puzzle Set",
    description: "STEM learning puzzles for ages 5-8",
    price: 29.99,
    image: "/puzzle-set.jpg",
    images: ["/puzzle-set.jpg", "/puzzle-pieces.jpg"],
    category: "Toys",
    type: "Educational", // Added product type
    stock: 0,
  },
  {
    id: "16",
    slug: "plush-teddy-bear",
    name: "Plush Teddy Bear",
    description: "Soft and cuddly teddy bear - 18 inches",
    price: 24.99,
    image: "/teddy-bear.jpg",
    images: ["/teddy-bear.jpg"],
    category: "Toys",
    type: "Plush", // Added product type
    stock: 56,
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug)
}

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((product) => product.category === category)
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured)
}

export function getCategories(): string[] {
  const categories = products.map((product) => product.category)
  return Array.from(new Set(categories)).sort()
}

export function getNewArrivals(): Product[] {
  return products.filter((product) => product.isNew)
}

export function getDiscountedProducts(): Product[] {
  return products.filter((product) => product.discount && product.discount > 0)
}

export function getProductTypes(category?: string): string[] {
  const filteredProducts = category ? products.filter((product) => product.category === category) : products
  const types = filteredProducts.map((product) => product.type).filter((type): type is string => !!type)
  return Array.from(new Set(types)).sort()
}
