import { ProductGridSkeleton } from "@/components/product-card-skeleton"
import { ProductCarouselSkeleton } from "@/components/product-carousel-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* New Arrivals carousel skeleton */}
      <section className="py-12">
        <ProductCarouselSkeleton />
      </section>

      {/* Featured Products carousel skeleton */}
      <section className="py-12">
        <ProductCarouselSkeleton />
      </section>

      {/* Categories section skeleton */}
      <section className="py-12">
        <div className="mb-8">
          {/* "Shop by Category" title skeleton */}
          <Skeleton className="h-9 w-64 mx-auto mb-6" />

          {/* Category filter buttons skeleton */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
        </div>

        {/* Product grid skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-40 mb-6" />
        </div>
        <ProductGridSkeleton count={8} />
      </section>
    </div>
  )
}
