import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mus-store.com"),
  title: {
    default: "MUS - Premium E-commerce Store",
    template: "%s | MUS",
  },
  description:
    "Shop premium products for modern living at MUS. Discover electronics, fashion, home goods, and more with fast shipping and excellent customer service.",
  keywords: [
    "e-commerce",
    "online shopping",
    "premium products",
    "electronics",
    "fashion",
    "home goods",
    "accessories",
    "MUS store",
  ],
  authors: [{ name: "MUS" }],
  creator: "MUS",
  publisher: "MUS",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png",
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "MUS",
    title: "MUS - Premium E-commerce Store",
    description: "Shop premium products for modern living",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MUS Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MUS - Premium E-commerce Store",
    description: "Shop premium products for modern living",
    images: ["/og-image.png"],
    creator: "@musstore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <Suspense fallback={<div className="h-[136px]" />}>
            <Header />
          </Suspense>
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
