import { SearchPageClient } from "@/components/search-page-client"
import { fetchProducts, SortBy, normalizeCategories } from "@/lib/products-api"
import type { Metadata } from "next"

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    categories?: string
    category?: string
    types?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
    outOfStock?: string
    newArrivals?: string
    featured?: string
    sort?: string
    page?: string
  }>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams
  const searchQuery = params.q || ""

  if (searchQuery) {
    return {
      title: `Search results for "${searchQuery}" - MUS`,
      description: `Find products matching "${searchQuery}"`,
    }
  }

  return {
    title: "Search Products - MUS",
    description: "Browse and search our product catalog",
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams

  // Parse URL parameters
  const searchQuery = params.q || ""
  const rawCategories =
    params.categories?.split(",").filter(Boolean) ||
    (params.category ? [params.category] : [])
  // Normalize categories to match backend enum (case-insensitive)
  const selectedCategories = normalizeCategories(rawCategories)
  const selectedTypes = params.types?.split(",").filter(Boolean) || []
  const minPrice = params.minPrice ? Number.parseInt(params.minPrice) : undefined
  const maxPrice = params.maxPrice ? Number.parseInt(params.maxPrice) : undefined
  const inStock = params.inStock === "true"
  const outOfStock = params.outOfStock === "true"
  const newArrivalsOnly = params.newArrivals === "true"
  const featuredOnly = params.featured === "true"
  const sortByParam = params.sort || "newest"
  const page = params.page ? Number.parseInt(params.page) : 1

  // Map frontend sort values to API sort values
  const sortByMap: Record<string, SortBy> = {
    "featured": SortBy.NEWEST,
    "price-low": SortBy.PRICE_LOW,
    "price-high": SortBy.PRICE_HIGH,
    "name": SortBy.NAME_ASC,
    "newest": SortBy.NEWEST,
  }
  const sortBy = sortByMap[sortByParam] || SortBy.NEWEST

  // Determine outOfStock parameter based on filters
  let outOfStockParam: boolean | undefined = undefined
  if (inStock && !outOfStock) {
    outOfStockParam = false // Show only in-stock items
  } else if (outOfStock && !inStock) {
    outOfStockParam = true // Show only out-of-stock items
  }
  // If both are true or both are false, show all items (undefined)

  // Fetch products from API using the unified endpoint
  const { products, pagination } = await fetchProducts({
    query: searchQuery || undefined,
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    types: selectedTypes.length > 0 ? selectedTypes : undefined,
    featured: featuredOnly || undefined,
    newArrival: newArrivalsOnly || undefined,
    outOfStock: outOfStockParam,
    sortBy,
    minPrice,
    maxPrice,
    page,
    limit: 24,
  })

  // Use products directly without client-side filtering
  const filteredProducts = products

  return (
    <SearchPageClient
      initialProducts={filteredProducts}
      initialPagination={pagination}
      searchQuery={searchQuery}
      selectedCategories={selectedCategories}
      selectedTypes={selectedTypes}
      minPrice={minPrice}
      maxPrice={maxPrice}
      inStock={inStock}
      outOfStock={outOfStock}
      newArrivalsOnly={newArrivalsOnly}
      featuredOnly={featuredOnly}
      sortBy={sortByParam as "featured" | "price-low" | "price-high" | "name"}
    />
  )
}
