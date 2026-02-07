import * as https from "https"
import * as http from "http"
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs"
import { join } from "path"
import sharp from "sharp"

/**
 * Download image from URL to local file system
 */
export async function downloadImage(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http

    // Ensure directory exists
    const dir = filepath.substring(0, filepath.lastIndexOf("/"))
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const file = createWriteStream(filepath)
    protocol
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file)
          file.on("finish", () => {
            file.close()
            resolve()
          })
        } else if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          file.close()
          if (response.headers.location) {
            downloadImage(response.headers.location, filepath).then(resolve).catch(reject)
          } else {
            reject(new Error(`Redirect without location header`))
          }
        } else {
          file.close()
          reject(new Error(`Failed to download image: ${response.statusCode}`))
        }
      })
      .on("error", (err) => {
        file.close()
        reject(err)
      })
  })
}

/**
 * Get placeholder book cover image URLs from various sources
 * Using picsum.photos for placeholder images with unique seeds
 */
export function getPlaceholderBookCover(bookTitle: string, index: number): string {
  // Use a hash of the book title + index for consistent but varied images
  const seed = Math.abs(hashCode(bookTitle + index)) % 1000

  // Return placeholder image URL (600x900 for book cover aspect ratio)
  return `https://picsum.photos/seed/${seed}/600/900`
}

/**
 * Simple hash function to generate consistent seeds from strings
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

/**
 * Convert local file to buffer format expected by S3UploadService
 */
export function fileToBuffer(filepath: string): {
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
} {
  const buffer = readFileSync(filepath)
  const filename = filepath.split("/").pop() || "image.jpg"

  // Determine mimetype from extension
  let mimetype = "image/jpeg"
  if (filename.endsWith(".png")) {
    mimetype = "image/png"
  } else if (filename.endsWith(".webp")) {
    mimetype = "image/webp"
  }

  return {
    buffer,
    originalname: filename,
    mimetype,
    size: buffer.length,
  }
}

/**
 * Fetch image from URL and return as buffer
 */
export async function fetchImageAsBuffer(url: string): Promise<{
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http

    protocol
      .get(url, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          if (response.headers.location) {
            fetchImageAsBuffer(response.headers.location).then(resolve).catch(reject)
          } else {
            reject(new Error(`Redirect without location header`))
          }
          return
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch image: ${response.statusCode}`))
          return
        }

        const chunks: Buffer[] = []
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
        response.on("end", () => {
          const buffer = Buffer.concat(chunks)
          const contentType = response.headers["content-type"] || "image/jpeg"

          // Extract filename from URL or use default
          const urlPath = new URL(url).pathname
          const filename = urlPath.split("/").pop() || "image.jpg"

          resolve({
            buffer,
            originalname: filename,
            mimetype: contentType,
            size: buffer.length,
          })
        })
      })
      .on("error", reject)
  })
}

/**
 * Download multiple placeholder images for all books
 * This is a helper to pre-download images if you want to store them locally
 */
export async function downloadPlaceholderImages(
  books: Array<{ name: string }>,
  outputDir: string,
): Promise<void> {
  console.log(`📥 Downloading ${books.length} placeholder images...`)

  for (let i = 0; i < books.length; i++) {
    const book = books[i]
    const imageUrl = getPlaceholderBookCover(book.name, i)
    const filename = `book-${i + 1}.jpg`
    const filepath = join(outputDir, filename)

    try {
      if (!existsSync(filepath)) {
        await downloadImage(imageUrl, filepath)
        console.log(`  ✓ Downloaded: ${filename}`)
      } else {
        console.log(`  - Skipped (exists): ${filename}`)
      }
    } catch (error) {
      console.error(`  ✗ Failed to download ${filename}:`, error instanceof Error ? error.message : error)
    }
  }

  console.log(`✅ Placeholder images download completed!`)
}

/**
 * Get image cache directory path
 * Using product-images as single source of truth for all cached images
 */
function getImageCacheDir(): string {
  // Use data/product-images relative to project root
  const cacheDir = join(process.cwd(), "data", "product-images")
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }
  return cacheDir
}

/**
 * Generate a URL-friendly slug from a product name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
    .substring(0, 100) // Limit length
}

/**
 * Generate cache filename from product title (using slug)
 */
function getCacheFilename(bookTitle: string, _index: number): string {
  const slug = generateSlug(bookTitle)
  return `${slug}.jpg`
}

/**
 * Get cached image as buffer or download if not cached
 * This function checks the local cache first and downloads only if needed
 */
export async function getCachedImageAsBuffer(
  bookTitle: string,
  index: number,
): Promise<{
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}> {
  const cacheDir = getImageCacheDir()
  const filename = getCacheFilename(bookTitle, index)
  const filepath = join(cacheDir, filename)

  // Check if image exists in cache
  if (existsSync(filepath)) {
    // Load from cache
    console.log(`  💾 Using cached image: ${filename}`)
    return fileToBuffer(filepath)
  }

  // Not in cache, download it
  console.log(`  📥 Downloading image: ${filename}`)
  const imageUrl = getPlaceholderBookCover(bookTitle, index)
  const imageBuffer = await fetchImageAsBuffer(imageUrl)

  // Save to cache for future use
  try {
    const buffer = imageBuffer.buffer
    const fs = await import("fs/promises")
    await fs.writeFile(filepath, buffer)
    console.log(`  ✓ Cached image: ${filename}`)
  } catch (error) {
    console.warn(`  ⚠️  Failed to cache image: ${filename}`, error instanceof Error ? error.message : error)
    // Continue anyway - we still have the buffer
  }

  return imageBuffer
}

/**
 * Create a resized image from an image buffer
 * Compresses and resizes the image to specified width
 */
async function resizeImage(
  imageBuffer: Buffer,
  maxWidth: number,
  quality: number = 80,
): Promise<Buffer> {
  try {
    return await sharp(imageBuffer)
      .resize(maxWidth, null, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality, progressive: true })
      .toBuffer()
  } catch (error) {
    console.error(`Failed to resize image to ${maxWidth}px:`, error instanceof Error ? error.message : error)
    throw error
  }
}

/**
 * Create a thumbnail from an image buffer (300px width)
 */
export async function createThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return resizeImage(imageBuffer, 300, 80)
}

/**
 * Create a medium size image from an image buffer (800px width)
 */
export async function createMediumImage(imageBuffer: Buffer): Promise<Buffer> {
  return resizeImage(imageBuffer, 800, 85)
}

/**
 * Create a large size image from an image buffer (1200px width)
 */
export async function createLargeImage(imageBuffer: Buffer): Promise<Buffer> {
  return resizeImage(imageBuffer, 1200, 90)
}

/**
 * Generic function to get cached resized image or create if not exists
 */
async function getCachedResizedImageAsBuffer(
  bookTitle: string,
  index: number,
  sizeName: string,
  createImageFn: (buffer: Buffer) => Promise<Buffer>,
): Promise<{
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}> {
  const cacheDir = getImageCacheDir()
  const slug = generateSlug(bookTitle)
  const filename = `${slug}-${sizeName}.jpg`
  const filepath = join(cacheDir, filename)

  // Check if resized image exists in cache
  if (existsSync(filepath)) {
    console.log(`  🖼️  Using cached ${sizeName}: ${filename}`)
    return fileToBuffer(filepath)
  }

  // Get original image first
  const originalImage = await getCachedImageAsBuffer(bookTitle, index)

  // Create resized image
  console.log(`  🔄 Creating ${sizeName}: ${filename}`)
  const resizedBuffer = await createImageFn(originalImage.buffer)

  // Save to cache
  try {
    const fs = await import("fs/promises")
    await fs.writeFile(filepath, resizedBuffer)
    console.log(`  ✓ Cached ${sizeName}: ${filename}`)
  } catch (error) {
    console.warn(`  ⚠️  Failed to cache ${sizeName}: ${filename}`, error instanceof Error ? error.message : error)
  }

  return {
    buffer: resizedBuffer,
    originalname: filename,
    mimetype: "image/jpeg",
    size: resizedBuffer.length,
  }
}

/**
 * Get cached thumbnail or create if not exists (300px)
 */
export async function getCachedThumbnailAsBuffer(
  bookTitle: string,
  index: number,
): Promise<{
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}> {
  return getCachedResizedImageAsBuffer(bookTitle, index, "thumb", createThumbnail)
}

/**
 * Get cached medium image or create if not exists (800px)
 */
export async function getCachedMediumAsBuffer(
  bookTitle: string,
  index: number,
): Promise<{
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}> {
  return getCachedResizedImageAsBuffer(bookTitle, index, "medium", createMediumImage)
}

/**
 * Get cached large image or create if not exists (1200px)
 */
export async function getCachedLargeAsBuffer(
  bookTitle: string,
  index: number,
): Promise<{
  buffer: Buffer
  originalname: string
  mimetype: string
  size: number
}> {
  return getCachedResizedImageAsBuffer(bookTitle, index, "large", createLargeImage)
}
