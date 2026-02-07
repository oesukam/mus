"use client"

import { useRef } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import type { Product } from "@/lib/types"
import { ProductCard } from "./product-card"
import { Button } from "./ui/button"

interface ProductCarouselProps {
  products: Product[]
  title: string
  viewAllLink: string
}

export function ProductCarousel({ products, title, viewAllLink }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      const newScrollPosition =
        scrollContainerRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount)
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <section className="relative">
      {/* Header with title and View All button */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-foreground text-balance">{title}</h2>
        <Button asChild variant="ghost" className="gap-2">
          <Link href={viewAllLink}>
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Carousel container */}
      <div className="relative group">
        {/* Left navigation button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 backdrop-blur shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Scrollable products container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-none w-[280px] snap-start">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Right navigation button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 backdrop-blur shadow-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
