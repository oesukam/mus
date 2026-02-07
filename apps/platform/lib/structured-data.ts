import type { Product } from "./types"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mus-store.com"

export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MUS",
    description: "Premium E-commerce Store - Shop premium products for modern living",
    url: SITE_URL,
    logo: `${SITE_URL}/mus-logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+250-788-123-456",
      contactType: "Customer Service",
      email: "shop@muselemu.com",
      availableLanguage: ["English"],
    },
    sameAs: [
      "https://facebook.com/musstore",
      "https://twitter.com/musstore",
      "https://instagram.com/musstore",
    ],
  }
}

export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MUS",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function generateProductSchema(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images?.map((img) => `${SITE_URL}${img}`) || [`${SITE_URL}${product.image}`],
    sku: product.id,
    brand: {
      "@type": "Brand",
      name: "MUS",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.slug}`,
      priceCurrency: "USD",
      price: product.price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "89",
    },
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export function generateProductListSchema(products: Product[], listName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        url: `${SITE_URL}/products/${product.slug}`,
        image: `${SITE_URL}${product.image}`,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "USD",
        },
      },
    })),
  }
}
