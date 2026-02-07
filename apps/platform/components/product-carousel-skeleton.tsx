import { Skeleton } from "@/components/ui/skeleton"
import { ProductCardSkeleton } from "./product-card-skeleton"

export function ProductCarouselSkeleton() {
  return (
    <section className="relative">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Carousel container skeleton */}
      <div className="relative">
        {/* Scrollable products skeleton */}
        <div className="flex gap-6 overflow-hidden pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-none w-[280px]">
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
