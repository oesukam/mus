"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { X, ZoomIn } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { ProductImage } from "@/lib/types"

interface ProductImageGalleryProps {
  images: ProductImage[] | string[]
  productName: string
}

// Helper to check if image is ProductImage type
function isProductImage(image: ProductImage | string): image is ProductImage {
  return typeof image === 'object' && 'url' in image
}

// Helper to check if media is a video
function isVideo(image: ProductImage | string): boolean {
  if (typeof image === 'string') {
    return false
  }
  return image.mimeType?.startsWith('video/') || false
}

// Get appropriate image URL based on size
function getImageUrl(image: ProductImage | string, size: 'thumbnail' | 'medium' | 'large' | 'original'): string {
  if (typeof image === 'string') {
    return image
  }

  switch (size) {
    case 'thumbnail':
      return image.urlThumbnail || image.url
    case 'medium':
      return image.urlMedium || image.url
    case 'large':
      return image.urlLarge || image.url
    case 'original':
    default:
      return image.url
  }
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x, y })
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Media - Use medium size for better quality/performance balance */}
        <div
          className="relative aspect-square overflow-hidden bg-secondary group"
          onClick={() => !isVideo(images[selectedImage]) && setIsFullScreen(true)}
        >
          {isVideo(images[selectedImage]) ? (
            <video
              src={getImageUrl(images[selectedImage], 'medium') || "/placeholder.svg"}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <div
                className="cursor-zoom-in w-full h-full"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <Image
                  src={getImageUrl(images[selectedImage], 'medium') || "/placeholder.svg"}
                  alt={`${productName} - Image ${selectedImage + 1}`}
                  fill
                  className={cn("object-cover transition-transform duration-200", isZoomed && "scale-150")}
                  style={
                    isZoomed
                      ? {
                          transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                        }
                      : undefined
                  }
                  priority
                />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  <span className="text-sm">Click to view full screen</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Grid - Use thumbnail size for optimal performance */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "relative aspect-square overflow-hidden bg-secondary border-2 transition-all hover:border-foreground",
                  selectedImage === index ? "border-foreground" : "border-transparent",
                )}
              >
                <Image
                  src={getImageUrl(image, 'thumbnail') || "/placeholder.svg"}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full Screen Dialog - Use large size for best quality */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
          <div className="relative w-full h-full bg-black">
            <button
              onClick={() => setIsFullScreen(false)}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            {isVideo(images[selectedImage]) ? (
              <div className="w-full h-full flex items-center justify-center p-8">
                <video
                  src={getImageUrl(images[selectedImage], 'large') || "/placeholder.svg"}
                  controls
                  className="max-w-full max-h-full"
                />
              </div>
            ) : (
              <Image
                src={getImageUrl(images[selectedImage], 'large') || "/placeholder.svg"}
                alt={`${productName} - Full view`}
                fill
                className="object-contain"
              />
            )}
            {/* Thumbnail Navigation in Full Screen */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-lg">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "relative w-16 h-16 overflow-hidden border-2 transition-all",
                      selectedImage === index ? "border-white" : "border-transparent opacity-60 hover:opacity-100",
                    )}
                  >
                    <Image
                      src={getImageUrl(image, 'thumbnail') || "/placeholder.svg"}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
