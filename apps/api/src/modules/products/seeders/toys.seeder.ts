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
  getCachedProductImageAsBuffer,
  getCachedProductThumbnailAsBuffer,
  getCachedProductMediumAsBuffer,
  getCachedProductLargeAsBuffer,
} from "../../../database/utils/image-seeder.util"
import { config } from "dotenv"

config()

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100)
}

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

  const fileExtension = imageBuffer.originalname.split(".").pop() || "jpg"
  const uuid = uuidv4()
  const fileName = `products/${uuid}.${fileExtension}`
  const thumbFileName = `products/${uuid}-thumb.${fileExtension}`
  const mediumFileName = `products/${uuid}-medium.${fileExtension}`
  const largeFileName = `products/${uuid}-large.${fileExtension}`

  try {
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

    await Promise.all([
      uploadToS3(fileName, imageBuffer.buffer, imageBuffer.mimetype),
      uploadToS3(thumbFileName, thumbnailBuffer.buffer, thumbnailBuffer.mimetype),
      uploadToS3(mediumFileName, mediumBuffer.buffer, mediumBuffer.mimetype),
      uploadToS3(largeFileName, largeBuffer.buffer, largeBuffer.mimetype),
    ])

    const generateUrl = (key: string): string => {
      if (endpoint) {
        const endpointUrl = endpoint.replace(/\/$/, "")
        return `${endpointUrl}/${bucketName}/${key}`
      }
      return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`
    }

    const fileUrl = generateUrl(fileName)
    const thumbFileUrl = generateUrl(thumbFileName)
    const mediumFileUrl = generateUrl(mediumFileName)
    const largeFileUrl = generateUrl(largeFileName)

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

    const productImage = productImageRepository.create({
      productId,
      fileId: savedFile.id,
      order,
      isPrimary,
    })
    await productImageRepository.save(productImage)

    if (isPrimary) {
      await productRepository.update(productId, { coverImageId: savedFile.id })
    }

    return savedFile
  } catch (error) {
    console.error(`    ✗ Failed to upload image for product ${productId}:`)
    console.error(`       Error:`, error)
    throw error
  }
}

export async function seedToys(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product)

  const s3Configured = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  )

  let s3Client: S3Client | null = null
  if (s3Configured) {
    s3Client = createS3Client()
    console.log("📸 S3/MinIO configured - toys images will be uploaded")
  } else {
    console.log("⚠️  S3/MinIO not configured - toys images will be skipped")
  }

  const toys = [
    {
      name: "Space Explorer Action Figure Set",
      summary: "6-piece articulated space astronaut action figure set",
      stockQuantity: 20,
      price: 3499,
      category: ProductCategory.TOYS,
      type: ProductType.ACTION_FIGURE,
      weightInKg: 0.45,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=800&fit=crop",
    },
    {
      name: "Strategic Conquest Board Game",
      summary: "Epic strategy board game for 2-6 players ages 10+",
      stockQuantity: 15,
      price: 5999,
      category: ProductCategory.TOYS,
      type: ProductType.BOARD_GAME,
      weightInKg: 1.2,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=800&h=800&fit=crop",
    },
    {
      name: "World Map 1000-Piece Puzzle",
      summary: "Illustrated world map jigsaw puzzle for adults",
      stockQuantity: 18,
      price: 2499,
      category: ProductCategory.TOYS,
      type: ProductType.PUZZLE,
      weightInKg: 0.7,
      imageUrl: "https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=800&h=800&fit=crop",
    },
    {
      name: "Princess Castle Playset Doll",
      summary: "Fashion doll with castle playset and accessories",
      stockQuantity: 14,
      price: 4999,
      category: ProductCategory.TOYS,
      type: ProductType.DOLL,
      weightInKg: 0.9,
      imageUrl: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&h=800&fit=crop",
    },
    {
      name: "STEM Robot Building Kit",
      summary: "Programmable robot building kit for kids 8-14",
      stockQuantity: 12,
      price: 7999,
      category: ProductCategory.TOYS,
      type: ProductType.EDUCATIONAL_TOY,
      weightInKg: 0.6,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=800&h=800&fit=crop",
    },
    {
      name: "Superhero Collection Action Figures",
      summary: "4-pack superhero action figures with LED effects",
      stockQuantity: 22,
      price: 4499,
      category: ProductCategory.TOYS,
      type: ProductType.ACTION_FIGURE,
      weightInKg: 0.55,
      imageUrl: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=800&h=800&fit=crop",
    },
    {
      name: "Family Trivia Night Board Game",
      summary: "Fun trivia game for the whole family ages 8+",
      stockQuantity: 20,
      price: 3999,
      category: ProductCategory.TOYS,
      type: ProductType.BOARD_GAME,
      weightInKg: 0.8,
      imageUrl: "https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=800&h=800&fit=crop",
    },
    {
      name: "Van Gogh Starry Night 500-Piece Puzzle",
      summary: "Premium quality art reproduction jigsaw puzzle",
      stockQuantity: 16,
      price: 1999,
      category: ProductCategory.TOYS,
      type: ProductType.PUZZLE,
      weightInKg: 0.5,
      imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=800&fit=crop",
    },
    {
      name: "Vintage Collectible Doll",
      summary: "Hand-painted porcelain collector doll with stand",
      stockQuantity: 6,
      price: 8999,
      category: ProductCategory.TOYS,
      type: ProductType.DOLL,
      weightInKg: 0.4,
      imageUrl: "https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=800&h=800&fit=crop",
    },
    {
      name: "Solar System Model Kit",
      summary: "Motorized solar system model educational toy",
      stockQuantity: 10,
      price: 4999,
      category: ProductCategory.TOYS,
      type: ProductType.EDUCATIONAL_TOY,
      weightInKg: 0.75,
      imageUrl: "https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=800&fit=crop",
    },
    {
      name: "Medieval Knights Action Figure Set",
      summary: "12-piece medieval castle and knights playset",
      stockQuantity: 18,
      price: 5499,
      category: ProductCategory.TOYS,
      type: ProductType.ACTION_FIGURE,
      weightInKg: 0.8,
      imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=800&fit=crop",
    },
    {
      name: "Microscope Science Kit for Kids",
      summary: "Real microscope kit with prepared slides and tools",
      stockQuantity: 9,
      price: 6999,
      category: ProductCategory.TOYS,
      type: ProductType.EDUCATIONAL_TOY,
      weightInKg: 1.1,
      imageUrl: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=800&fit=crop",
    },
  ]

  const vatPercentage = 18
  const currency = Currency.RWF
  const country = Country.RWANDA

  let seededCount = 0
  let skippedCount = 0
  let imagesUploadedCount = 0
  let imagesFailedCount = 0

  for (let i = 0; i < toys.length; i++) {
    const itemData = toys[i]
    const slug = generateSlug(itemData.name)

    const existingProduct = await productRepository.findOne({ where: { slug } })

    let productToProcess: Product

    if (!existingProduct) {
      const product = productRepository.create({
        ...itemData,
        slug,
        description: `${itemData.name} - ${itemData.summary}. Fun and engaging toy perfect for hours of entertainment.`,
        vatPercentage,
        currency,
        country,
        isActive: true,
      })
      productToProcess = await productRepository.save(product)
      console.log(`✓ Seeded toy: ${itemData.name} (${itemData.price} RWF)`)
      seededCount++
    } else {
      console.log(`- Toy already exists: ${itemData.name}`)
      productToProcess = existingProduct
      skippedCount++
    }

    if (s3Configured && s3Client && !productToProcess.coverImageId) {
      try {
        const imageBuffer = await getCachedProductImageAsBuffer(itemData.name, i, itemData.imageUrl)
        const thumbnailBuffer = await getCachedProductThumbnailAsBuffer(
          itemData.name,
          i,
          itemData.imageUrl,
        )
        const mediumBuffer = await getCachedProductMediumAsBuffer(
          itemData.name,
          i,
          itemData.imageUrl,
        )
        const largeBuffer = await getCachedProductLargeAsBuffer(itemData.name, i, itemData.imageUrl)

        await uploadProductImage(
          dataSource,
          s3Client,
          imageBuffer,
          thumbnailBuffer,
          mediumBuffer,
          largeBuffer,
          productToProcess.id,
          itemData.name,
          0,
          true,
        )
        console.log(`  📸 All image sizes uploaded for: ${itemData.name}`)
        imagesUploadedCount++
      } catch (error) {
        console.error(
          `  ✗ Image upload failed for: ${itemData.name}`,
          error instanceof Error ? error.message : error,
        )
        imagesFailedCount++
      }
    } else if (productToProcess.coverImageId) {
      console.log(`  - Image already exists for: ${itemData.name}`)
    }
  }

  console.log(`\n🧸 Toys seeding completed!`)
  console.log(`   ✓ Seeded: ${seededCount} toys`)
  console.log(`   - Skipped: ${skippedCount} toys (already exist)`)
  console.log(`   📊 Total in file: ${toys.length} toys`)

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
