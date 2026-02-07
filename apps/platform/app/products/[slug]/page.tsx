import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, Truck, Shield } from "lucide-react"
import type { Metadata } from "next"
import { fetchProductBySlug, fetchProductsByCategory } from "@/lib/products-api"
import { getReviewsByProductId, getAverageRating, getReviewCount } from "@/lib/reviews"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { ProductGrid } from "@/components/product-grid"
import { ProductImageGallery } from "@/components/product-image-gallery"
import { StockNotificationForm } from "@/components/stock-notification-form"
import { WishlistButton } from "@/components/wishlist-button"
import { StructuredData } from "@/components/structured-data"
import { ProductReviews } from "@/components/product-reviews"
import { StarRating } from "@/components/star-rating"
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/structured-data"
import { ProductPrice } from "@/components/product-price"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

// Force dynamic rendering to avoid build-time API calls
export const dynamic = 'force-dynamic'
export const dynamicParams = true

export async function generateStaticParams() {
  // For now, return empty array to enable dynamic rendering
  // Can be updated to fetch all product slugs if needed for static generation
  return []
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await fetchProductBySlug(slug)

  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mus-store.com"
  const imageUrl = product.coverImage?.urlLarge || product.coverImage?.url || product.image

  return {
    title: product.name,
    description: product.description,
    keywords: [product.name, product.category, "buy online", "premium", "MUS store"],
    openGraph: {
      title: product.name,
      description: product.description,
      images: [
        {
          url: imageUrl.startsWith("http") ? imageUrl : `${SITE_URL}${imageUrl}`,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [imageUrl.startsWith("http") ? imageUrl : `${SITE_URL}${imageUrl}`],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await fetchProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const relatedProducts = (await fetchProductsByCategory(product.category))
    .filter((p) => p.id !== product.id)
    .slice(0, 4)

  // Use images array if available, otherwise create array with cover image
  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : product.coverImage
        ? [product.coverImage as any] // Cast to match ProductImage interface
        : [product.image]

  const reviews = getReviewsByProductId(product.id)
  const averageRating = getAverageRating(product.id)
  const reviewCount = getReviewCount(product.id)

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: product.category, url: `/search?category=${product.category}` },
    { name: product.name, url: `/products/${product.slug}` },
  ]

  return (
    <>
      <StructuredData data={generateProductSchema(product)} />
      <StructuredData data={generateBreadcrumbSchema(breadcrumbs)} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="lg:col-span-2">
            <ProductImageGallery images={productImages} productName={product.name} />
          </div>

          <div className="flex flex-col">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                {product.category}
              </p>
              <h1 className="text-4xl font-bold text-foreground mt-2 text-balance">
                {product.name}
              </h1>
              {reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <StarRating rating={averageRating} size="md" showNumber />
                  <span className="text-sm text-muted-foreground">({reviewCount} reviews)</span>
                </div>
              )}
            </div>

            <ProductPrice
              price={product.price}
              currency={product.currency}
              className="text-3xl font-bold text-foreground mb-6"
            />

            <p className="text-base text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            {product.weightInKg && product.weightInKg > 0 && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-semibold text-foreground mb-2">Specifications</h3>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-sm text-muted-foreground">Weight:</span>
                  <span className="text-sm font-medium text-foreground">
                    {product.weightInKg} kg
                  </span>
                </div>
              </div>
            )}

            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-2">
                Stock: {product.stockQuantity > 0 ? `${product.stockQuantity} available` : "Out of stock"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                {product.stockQuantity > 0 ? (
                  <AddToCartButton product={product} className="flex-1" />
                ) : (
                  <div className="flex-1">
                    <StockNotificationForm productId={product.id} productName={product.name} />
                  </div>
                )}
                <WishlistButton
                  product={product}
                  variant="outline"
                  size="lg"
                  showText
                  className="bg-transparent sm:w-auto w-full"
                />
              </div>
            </div>

            <div className="border-t border-border pt-8 space-y-4">
              <div className="flex items-start gap-4">
                <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Premium Quality</h3>
                  <p className="text-sm text-muted-foreground">
                    Carefully selected for superior quality and durability
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Free Shipping</h3>
                  <p className="text-sm text-muted-foreground">
                    Free shipping on all orders over $100
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">2-Year Warranty</h3>
                  <p className="text-sm text-muted-foreground">
                    Protected by our comprehensive warranty program
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {reviewCount > 0 && (
          <div className="mt-16 border-t pt-16">
            <ProductReviews
              productId={product.id}
              reviews={reviews}
              averageRating={averageRating}
              totalReviews={reviewCount}
            />
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <ProductGrid products={relatedProducts} title="You might also like" />
          </div>
        )}
      </div>
    </>
  )
}
