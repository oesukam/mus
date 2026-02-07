"use client"

import { ProductCard } from "@/components/product-card"
import { SearchFilters } from "@/components/search-filters"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, Loader2 } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useRouter, usePathname } from "next/navigation"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import type { Product } from "@/lib/types"
import { fetchProducts } from "@/lib/products-api"
import { useCurrencyStore } from "@/lib/currency-store"
import { getDefaultMaxPrice, getPriceStep } from "@/lib/currencies"

interface SearchPageClientProps {
  initialProducts: Product[]
  initialPagination: any
  searchQuery: string
  selectedCategories: string[]
  selectedTypes: string[]
  minPrice?: number
  maxPrice?: number
  inStock: boolean
  outOfStock: boolean
  newArrivalsOnly: boolean
  featuredOnly: boolean
  sortBy: "featured" | "price-low" | "price-high" | "name"
}

export function SearchPageClient({
  initialProducts,
  initialPagination,
  searchQuery,
  selectedCategories,
  selectedTypes,
  minPrice = 0,
  maxPrice,
  inStock,
  outOfStock,
  newArrivalsOnly,
  featuredOnly,
  sortBy,
}: SearchPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [isFilterChanging, setIsFilterChanging] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout>()

  // Get currency from store
  const currency = useCurrencyStore((state) => state.currency)

  // Calculate dynamic max price and step based on currency
  const maxPriceLimit = useMemo(() => getDefaultMaxPrice(currency), [currency])
  const priceStep = useMemo(() => getPriceStep(currency), [currency])

  // Use dynamic default if maxPrice not provided
  const defaultMaxPrice = maxPrice ?? maxPriceLimit

  // Infinite scroll state
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [currentPage, setCurrentPage] = useState(initialPagination.page)
  const [hasMore, setHasMore] = useState(currentPage < initialPagination.totalPages)
  const [isLoading, setIsLoading] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Reset products when filters or initial products change
  useEffect(() => {
    // Clear any pending timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
    }

    // Delay hiding the loader to prevent blinking
    // Only hide after minimum display time
    loadingTimeoutRef.current = setTimeout(() => {
      setIsFilterChanging(false)
    }, 300) // Minimum 300ms display time

    setProducts(initialProducts)
    setCurrentPage(initialPagination.page)
    setHasMore(initialPagination.page < initialPagination.totalPages)

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [initialProducts, initialPagination])

  // Load more products
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      const sortByValue = sortBy === "featured" ? "newest" : sortBy

      // Determine outOfStock parameter based on filters
      let outOfStockParam: boolean | undefined = undefined
      if (inStock && !outOfStock) {
        outOfStockParam = false // Show only in-stock items
      } else if (outOfStock && !inStock) {
        outOfStockParam = true // Show only out-of-stock items
      }
      // If both are true or both are false, show all items (undefined)

      const { products: newProducts, pagination } = await fetchProducts({
        query: searchQuery || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        minPrice: minPrice !== 0 ? minPrice : undefined,
        maxPrice: defaultMaxPrice !== maxPriceLimit ? defaultMaxPrice : undefined,
        outOfStock: outOfStockParam,
        newArrival: newArrivalsOnly || undefined,
        featured: featuredOnly || undefined,
        sortBy: sortByValue as any,
        page: nextPage,
        limit: initialPagination.limit,
      })

      setProducts((prev) => [...prev, ...newProducts])
      setCurrentPage(nextPage)
      setHasMore(nextPage < pagination.totalPages)
    } catch (error) {
      console.error("Failed to load more products:", error)
    } finally {
      setIsLoading(false)
    }
  }, [
    isLoading,
    hasMore,
    currentPage,
    searchQuery,
    selectedCategories,
    selectedTypes,
    minPrice,
    maxPrice,
    inStock,
    outOfStock,
    newArrivalsOnly,
    featuredOnly,
    sortBy,
    initialPagination.limit,
    defaultMaxPrice,
    maxPriceLimit,
  ])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoading, loadMore])

  const updateURL = (updates: Record<string, string | string[] | number | boolean | null>) => {
    // Only show loading if not already loading
    // This prevents multiple rapid filter changes from causing blinks
    if (!isFilterChanging) {
      setIsFilterChanging(true)
    }

    const params = new URLSearchParams()

    // Preserve existing search query
    if (searchQuery) params.set("q", searchQuery)

    // Apply updates
    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === null ||
        value === false ||
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        (key === "minPrice" && value === 0) ||
        (key === "maxPrice" && value === maxPriceLimit) // Use dynamic max
      ) {
        params.delete(key)
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","))
      } else if (typeof value === "boolean") {
        params.set(key, "true")
      } else {
        params.set(key, String(value))
      }
    })

    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname
    router.push(newUrl)
  }

  const clearAllFilters = () => {
    router.push(pathname)
    setMobileFiltersOpen(false)
  }

  const filterProps = {
    selectedCategories,
    setSelectedCategories: (categories: string[]) => updateURL({ categories }),
    selectedTypes,
    setSelectedTypes: (types: string[]) => updateURL({ types }),
    priceRange: [minPrice, defaultMaxPrice] as [number, number],
    setPriceRange: (range: [number, number]) =>
      updateURL({ minPrice: range[0], maxPrice: range[1] }),
    maxPriceLimit,
    priceStep,
    inStock,
    setInStock: (value: boolean) => updateURL({ inStock: value || null }),
    outOfStock,
    setOutOfStock: (value: boolean) => updateURL({ outOfStock: value || null }),
    newArrivalsOnly,
    setNewArrivalsOnly: (value: boolean) => updateURL({ newArrivals: value || null }),
    featuredOnly,
    setFeaturedOnly: (value: boolean) => updateURL({ featured: value || null }),
    sortBy,
    setSortBy: (sort: "featured" | "price-low" | "price-high" | "name") =>
      updateURL({ sort }),
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-end lg:justify-end">
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-96 p-0 flex flex-col">
              <div className="sticky top-0 bg-background border-b border-border px-6 py-4 z-10">
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <SearchFilters {...filterProps} isMobile={true} />
              </div>

              <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 space-y-3 z-10">
                <Button className="w-full" size="lg" onClick={() => setMobileFiltersOpen(false)}>
                  Show {initialPagination.total}{" "}
                  {initialPagination.total === 1 ? "Product" : "Products"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  size="lg"
                  onClick={clearAllFilters}
                >
                  Clear all filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2">
            <SearchFilters {...filterProps} />
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {searchQuery ? `Search results for "${searchQuery}"` : "All Products"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {initialPagination.total} {initialPagination.total === 1 ? "product" : "products"}{" "}
              found
            </p>
          </div>

          {isFilterChanging ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {/* Loading skeletons */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-border rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-6 bg-muted rounded w-1/4" />
                      <div className="h-9 bg-muted rounded w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={`${product.id}-${product.slug}`} product={product} />
                ))}
              </div>

              {/* Intersection Observer target */}
              <div ref={observerTarget} className="py-8 flex justify-center">
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more products...</span>
                  </div>
                )}
                {!hasMore && products.length > initialPagination.limit && (
                  <p className="text-sm text-muted-foreground">No more products to load</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                No products found matching your filters.
              </p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
