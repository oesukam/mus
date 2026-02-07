"use client"

import type { Product } from "@/lib/types"
import { ProductCarousel } from "@/components/product-carousel"

interface HomePageClientProps {
  featuredProducts: Product[]
  newArrivals: Product[]
}

export function HomePageClient({ featuredProducts, newArrivals }: HomePageClientProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section id="new-arrivals" className="py-12">
        <ProductCarousel products={newArrivals} title="New Arrivals" viewAllLink="/search?newArrivals=true" />
      </section>

      <section id="featured" className="py-12">
        <ProductCarousel products={featuredProducts} title="Featured Products" viewAllLink="/search?featured=true" />
      </section>
    </div>
  )
}
