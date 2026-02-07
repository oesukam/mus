import { StructuredData } from "@/components/structured-data"
import { generateOrganizationSchema, generateWebSiteSchema, generateProductListSchema } from "@/lib/structured-data"
import { fetchProducts, fetchFeaturedProducts, fetchNewArrivals } from "@/lib/products-api"
import { HomePageClient } from "@/components/home-page-client"

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Fetch only featured and new arrivals for home page
  const [
    featuredProducts,
    newArrivals
  ] = await Promise.all([
    fetchFeaturedProducts(8),
    fetchNewArrivals(8)
  ])

  return (
    <>
      <StructuredData data={generateOrganizationSchema()} />
      <StructuredData data={generateWebSiteSchema()} />
      <StructuredData data={generateProductListSchema(featuredProducts, "Featured Products")} />

      <HomePageClient
        featuredProducts={featuredProducts}
        newArrivals={newArrivals}
      />
    </>
  )
}
