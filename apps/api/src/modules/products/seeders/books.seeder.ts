import { DataSource } from "typeorm"
import { Product } from "../entities/product.entity"
import { ProductImage } from "../entities/product-image.entity"
import { File } from "../../../common/entities/file.entity"
import { ProductCategory, ProductType } from "../enums/product-category.enum"
import { Currency } from "../enums/currency.enum"
import { Country } from "../enums/country.enum"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"
import {
  getCachedImageAsBuffer,
  getCachedThumbnailAsBuffer,
  getCachedMediumAsBuffer,
  getCachedLargeAsBuffer,
} from "../../../database/utils/image-seeder.util"
import { config } from "dotenv"

// Load environment variables
config()

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
 * Initialize S3 client for image uploads
 */
function createS3Client(): S3Client {
  const region = process.env.AWS_REGION || "us-east-1"
  const endpoint = process.env.S3_ENDPOINT
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true"

  const s3Config: any = {
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  }

  if (endpoint) {
    s3Config.endpoint = endpoint
    s3Config.forcePathStyle = forcePathStyle
  }

  return new S3Client(s3Config)
}

/**
 * Upload image buffer to S3 and create file record
 * Returns the created File entity
 */
async function uploadProductImage(
  dataSource: DataSource,
  s3Client: S3Client,
  imageBuffer: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  thumbnailBuffer: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  mediumBuffer: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  largeBuffer: { buffer: Buffer; originalname: string; mimetype: string; size: number },
  productId: number,
  productName: string,
  order: number = 0,
  isPrimary: boolean = true,
): Promise<File> {
  const fileRepository = dataSource.getRepository(File)
  const productImageRepository = dataSource.getRepository(ProductImage)
  const productRepository = dataSource.getRepository(Product)

  const bucketName = process.env.AWS_S3_BUCKET_NAME || ""
  const region = process.env.AWS_REGION || "us-east-1"
  const endpoint = process.env.S3_ENDPOINT

  // Generate unique filenames for all image sizes
  const fileExtension = imageBuffer.originalname.split(".").pop() || "jpg"
  const uuid = uuidv4()
  const fileName = `products/${uuid}.${fileExtension}`
  const thumbFileName = `products/${uuid}-thumb.${fileExtension}`
  const mediumFileName = `products/${uuid}-medium.${fileExtension}`
  const largeFileName = `products/${uuid}-large.${fileExtension}`

  try {
    // Helper function to upload image to S3
    const uploadToS3 = async (key: string, buffer: Buffer, mimetype: string) => {
      const params: any = {
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }
      if (!endpoint) {
        params.ACL = "public-read"
      }
      await s3Client.send(new PutObjectCommand(params))
    }

    // Upload all image sizes to S3
    await Promise.all([
      uploadToS3(fileName, imageBuffer.buffer, imageBuffer.mimetype),
      uploadToS3(thumbFileName, thumbnailBuffer.buffer, thumbnailBuffer.mimetype),
      uploadToS3(mediumFileName, mediumBuffer.buffer, mediumBuffer.mimetype),
      uploadToS3(largeFileName, largeBuffer.buffer, largeBuffer.mimetype),
    ])

    // Helper function to generate file URL
    const generateUrl = (key: string): string => {
      if (endpoint) {
        const endpointUrl = endpoint.replace(/\/$/, "")
        return `${endpointUrl}/${bucketName}/${key}`
      }
      return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`
    }

    // Generate URLs for all sizes
    const fileUrl = generateUrl(fileName)
    const thumbFileUrl = generateUrl(thumbFileName)
    const mediumFileUrl = generateUrl(mediumFileName)
    const largeFileUrl = generateUrl(largeFileName)

    // Save file metadata to database with all URLs
    const fileEntity = fileRepository.create({
      key: fileName,
      url: fileUrl,
      urlThumbnail: thumbFileUrl,
      urlMedium: mediumFileUrl,
      urlLarge: largeFileUrl,
      originalName: imageBuffer.originalname,
      title: `${productName} - Cover Image`,
      mimeType: imageBuffer.mimetype,
      size: imageBuffer.size,
      folder: "products",
      entityType: "product",
      entityId: productId,
    })
    const savedFile = await fileRepository.save(fileEntity)

    // Create ProductImage record
    const productImage = productImageRepository.create({
      productId,
      fileId: savedFile.id,
      order,
      isPrimary,
    })
    await productImageRepository.save(productImage)

    // If this is the primary image, set it as the product's cover image
    if (isPrimary) {
      await productRepository.update(productId, { coverImageId: savedFile.id })
    }

    return savedFile
  } catch (error) {
    console.error(`    ✗ Failed to upload image for product ${productId}:`)
    console.error(`       Error type: ${typeof error}`)
    console.error(`       Error:`, error)
    if (error instanceof Error) {
      console.error(`       Message: ${error.message}`)
      console.error(`       Stack: ${error.stack}`)
    }
    throw error
  }
}

export async function seedBooks(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product)

  // Check if S3 is configured
  const s3Configured = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  )

  let s3Client: S3Client | null = null
  if (s3Configured) {
    // Initialize S3 client for image uploads
    s3Client = createS3Client()
    console.log("📸 S3/MinIO configured - images will be uploaded")
  } else {
    console.log("⚠️  S3/MinIO not configured - images will be skipped")
    console.log("   To enable image uploads, configure S3 environment variables")
    console.log("   See: docker-compose.minio.yml for local MinIO setup\n")
  }

  const books = [
    {
      name: "Master Your Time Thibaut Meurisse",
      stockQuantity: 1,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Master Your Beliefs Thibaut Meurisse",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Grammar Smart SATGRE Princeton Review",
      stockQuantity: 2,
      price: 14111,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Hobbit",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.NOVEL,
    },
    {
      name: "How To Say It",
      stockQuantity: 1,
      price: 14552,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Writing SmartSATGRE/ The Princeton Review",
      stockQuantity: 1,
      price: 14111,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Subtle Art of Not Giving a F*ck",
      stockQuantity: 2,
      price: 13850,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Fifty Great Short Stories 50",
      stockQuantity: 2,
      price: 14853,
      category: ProductCategory.BOOKS,
      type: ProductType.NOVEL,
    },
    {
      name: "The Disciplined Trader",
      stockQuantity: 1,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The $100 Startup Chris Guillebeau",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Power of Moments",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Everybody Lies",
      stockQuantity: 2,
      price: 14753,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "THE MAKING OF A MANAGER",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Eat That Frog",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Do What You Are",
      stockQuantity: 1,
      price: 14312,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Deep Work: Rules for Focused Succes",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Die with Zero",
      stockQuantity: 2,
      price: 14251,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Find Your Why",
      stockQuantity: 1,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Game Theory Oxford",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Rich Dad Poor Dad",
      stockQuantity: 2,
      price: 14713,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "12 Rules for life",
      stockQuantity: 2,
      price: 14312,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Power of Discipline How to Use Self Con",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Shawshank Redemption",
      stockQuantity: 2,
      price: 14352,
      category: ProductCategory.BOOKS,
      type: ProductType.NOVEL,
    },
    {
      name: "How to Read a Book",
      stockQuantity: 2,
      price: 14512,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "10 It Essays That Will Change The Way You Think",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Atomic Habits",
      stockQuantity: 2,
      price: 13850,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Getting Things Done",
      stockQuantity: 2,
      price: 14131,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Greatest Salesman in the World",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Trader in the Smarter",
      stockQuantity: 2,
      price: 14251,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Homo Deus: A Brief History of Tomorrow",
      stockQuantity: 1,
      price: 14954,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Hidden Potarit",
      stockQuantity: 1,
      price: 14151,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Never Split the Difference",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Poor Economics",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Compound Effect",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The 4-Hour Work Week Timothy Ferriss",
      stockQuantity: 2,
      price: 14151,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Being Logical A Guide to Good Thinking",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Word Power Made Easy",
      stockQuantity: 2,
      price: 14874,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Walk That Frog",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Concise 48 Laws Of Power",
      stockQuantity: 1,
      price: 13850,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Secrets of the Millionaire Mind",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Declaration of Independence",
      stockQuantity: 1,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The 7 Habits of Highly Effective People",
      stockQuantity: 2,
      price: 14251,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Fine Art of Small Talk",
      stockQuantity: 1,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Ego is the Enemy",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Think and Grow Rich",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Master Your Emotions",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "How to Become a Straight A Student",
      stockQuantity: 2,
      price: 14251,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Power of Now",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Mindset: The Psychology of Success",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Sapiens: A Brief History of Humankind",
      stockQuantity: 2,
      price: 14552,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Master Your Focus Thibaut Meurisse",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Effective Executive",
      stockQuantity: 1,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "David and Goliath",
      stockQuantity: 2,
      price: 14251,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Happiness Is... 500 Ways",
      stockQuantity: 1,
      price: 14111,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Steve Jobs: The Man Who Thought Different",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Lean StartUP",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Man, Man Lives Riches",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The Mountain Is You",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "The 80/20 Principle",
      stockQuantity: 1,
      price: 14251,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Win Your Inner Battles",
      stockQuantity: 2,
      price: 14071,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Built to Last",
      stockQuantity: 1,
      price: 14251,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Unshakeable",
      stockQuantity: 1,
      price: 14471,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
    {
      name: "Thirty Days to Better English",
      stockQuantity: 2,
      price: 14051,
      category: ProductCategory.BOOKS,
      type: ProductType.TEXTBOOK,
    },
  ]

  const vatPercentage = 18
  const currency = Currency.RWF
  const country = Country.RWANDA

  let seededCount = 0
  let skippedCount = 0
  let imagesUploadedCount = 0
  let imagesFailedCount = 0

  for (let i = 0; i < books.length; i++) {
    const bookData = books[i]
    const slug = generateSlug(bookData.name)

    // Check if book already exists (by slug to avoid duplicates)
    const existingBook = await productRepository.findOne({
      where: { slug },
    })

    let productToProcess: Product

    if (!existingBook) {
      const book = productRepository.create({
        ...bookData,
        slug,
        description: `${bookData.name} - A great addition to your library`,
        vatPercentage,
        currency,
        country,
        isActive: true,
      })
      productToProcess = await productRepository.save(book)
      console.log(`✓ Seeded book: ${bookData.name} (${bookData.price} RWF)`)
      seededCount++
    } else {
      console.log(`- Book already exists: ${bookData.name}`)
      productToProcess = existingBook
      skippedCount++
    }

    // Upload all image sizes for the book (only if S3 is configured and no cover image exists)
    if (s3Configured && s3Client && !productToProcess.coverImageId) {
      try {
        // Get all image sizes
        const imageBuffer = await getCachedImageAsBuffer(bookData.name, i)
        const thumbnailBuffer = await getCachedThumbnailAsBuffer(bookData.name, i)
        const mediumBuffer = await getCachedMediumAsBuffer(bookData.name, i)
        const largeBuffer = await getCachedLargeAsBuffer(bookData.name, i)

        await uploadProductImage(
          dataSource,
          s3Client,
          imageBuffer,
          thumbnailBuffer,
          mediumBuffer,
          largeBuffer,
          productToProcess.id,
          bookData.name,
          0,
          true,
        )
        console.log(`  📸 All image sizes uploaded for: ${bookData.name}`)
        imagesUploadedCount++
      } catch (error) {
        console.error(
          `  ✗ Image upload failed for: ${bookData.name}`,
          error instanceof Error ? error.message : error,
        )
        imagesFailedCount++
      }
    } else if (productToProcess.coverImageId) {
      console.log(`  - Image already exists for: ${bookData.name}`)
    }
  }

  console.log(`\n📚 Books seeding completed!`)
  console.log(`   ✓ Seeded: ${seededCount} books`)
  console.log(`   - Skipped: ${skippedCount} books (already exist)`)
  console.log(`   📊 Total in file: ${books.length} books`)

  if (s3Configured) {
    console.log(`   📸 Images uploaded: ${imagesUploadedCount}`)
    if (imagesFailedCount > 0) {
      console.log(`   ✗ Images failed: ${imagesFailedCount}`)
    }
  } else {
    console.log(`   ⚠️  Images skipped (S3 not configured)`)
  }
  console.log(``)
}
