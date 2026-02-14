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

export async function seedSports(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product)

  const s3Configured = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  )

  let s3Client: S3Client | null = null
  if (s3Configured) {
    s3Client = createS3Client()
    console.log("📸 S3/MinIO configured - sports product images will be uploaded")
  } else {
    console.log("⚠️  S3/MinIO not configured - sports product images will be skipped")
  }

  const sportsProducts = [
    {
      name: "ProFlex Yoga Mat 6mm",
      summary: "Non-slip TPE yoga mat with alignment lines",
      stockQuantity: 25,
      price: 4999,
      category: ProductCategory.SPORTS,
      type: ProductType.EQUIPMENT,
      weightInKg: 1.2,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=800&fit=crop",
    },
    {
      name: "DryFit Performance T-Shirt",
      summary: "Moisture-wicking athletic t-shirt with mesh panels",
      stockQuantity: 40,
      price: 2999,
      category: ProductCategory.SPORTS,
      type: ProductType.APPAREL,
      weightInKg: 0.15,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop",
    },
    {
      name: "TrailRunner Pro Hiking Boots",
      summary: "Waterproof hiking boots with Vibram outsole",
      stockQuantity: 12,
      price: 17999,
      category: ProductCategory.SPORTS,
      type: ProductType.FOOTWEAR,
      weightInKg: 1.4,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
    },
    {
      name: "Resistance Bands Set 5-Pack",
      summary: "Progressive resistance bands with handles and door anchor",
      stockQuantity: 30,
      price: 3499,
      category: ProductCategory.SPORTS,
      type: ProductType.ACCESSORIES_SPORTS,
      weightInKg: 0.5,
      imageUrl: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800&h=800&fit=crop",
    },
    {
      name: "Adjustable Dumbbell Set 25kg",
      summary: "Space-saving adjustable dumbbells 2.5kg to 25kg",
      stockQuantity: 8,
      price: 34999,
      category: ProductCategory.SPORTS,
      type: ProductType.EQUIPMENT,
      weightInKg: 25.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop",
    },
    {
      name: "Compression Running Tights",
      summary: "Full-length compression tights with reflective details",
      stockQuantity: 22,
      price: 5999,
      category: ProductCategory.SPORTS,
      type: ProductType.APPAREL,
      weightInKg: 0.2,
      imageUrl: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop",
    },
    {
      name: "CrossFit Training Shoes",
      summary: "Flat-sole training shoes for weightlifting and HIIT",
      stockQuantity: 15,
      price: 13999,
      category: ProductCategory.SPORTS,
      type: ProductType.FOOTWEAR,
      weightInKg: 0.8,
      imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=800&fit=crop",
    },
    {
      name: "Foam Roller Recovery Set",
      summary: "High-density foam roller with massage ball and stick",
      stockQuantity: 20,
      price: 4499,
      category: ProductCategory.SPORTS,
      type: ProductType.ACCESSORIES_SPORTS,
      weightInKg: 0.9,
      imageUrl: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&h=800&fit=crop",
    },
    {
      name: "Olympic Barbell 20kg",
      summary: "Competition-grade Olympic barbell with knurling",
      stockQuantity: 5,
      price: 24999,
      category: ProductCategory.SPORTS,
      type: ProductType.EQUIPMENT,
      weightInKg: 20.0,
      imageUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=800&fit=crop",
    },
    {
      name: "Windbreaker Running Jacket",
      summary: "Packable windbreaker with water-resistant coating",
      stockQuantity: 18,
      price: 7999,
      category: ProductCategory.SPORTS,
      type: ProductType.APPAREL,
      weightInKg: 0.25,
      imageUrl: "https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?w=800&h=800&fit=crop",
    },
    {
      name: "Court Pro Tennis Shoes",
      summary: "Multi-court tennis shoes with herringbone tread",
      stockQuantity: 14,
      price: 11999,
      category: ProductCategory.SPORTS,
      type: ProductType.FOOTWEAR,
      weightInKg: 0.72,
      imageUrl: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800&h=800&fit=crop",
    },
    {
      name: "Jump Rope Speed Pro",
      summary: "Weighted speed jump rope with ball bearings",
      stockQuantity: 35,
      price: 1999,
      category: ProductCategory.SPORTS,
      type: ProductType.ACCESSORIES_SPORTS,
      weightInKg: 0.3,
      imageUrl: "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?w=800&h=800&fit=crop",
    },
  ]

  const vatPercentage = 18
  const currency = Currency.RWF
  const country = Country.RWANDA

  let seededCount = 0
  let skippedCount = 0
  let imagesUploadedCount = 0
  let imagesFailedCount = 0

  for (let i = 0; i < sportsProducts.length; i++) {
    const itemData = sportsProducts[i]
    const slug = generateSlug(itemData.name)

    const existingProduct = await productRepository.findOne({ where: { slug } })

    let productToProcess: Product

    if (!existingProduct) {
      const product = productRepository.create({
        ...itemData,
        slug,
        description: `${itemData.name} - ${itemData.summary}. Gear up for peak performance with this sports essential.`,
        vatPercentage,
        currency,
        country,
        isActive: true,
      })
      productToProcess = await productRepository.save(product)
      console.log(`✓ Seeded sports product: ${itemData.name} (${itemData.price} RWF)`)
      seededCount++
    } else {
      console.log(`- Sports product already exists: ${itemData.name}`)
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

  console.log(`\n🏃 Sports products seeding completed!`)
  console.log(`   ✓ Seeded: ${seededCount} sports products`)
  console.log(`   - Skipped: ${skippedCount} sports products (already exist)`)
  console.log(`   📊 Total in file: ${sportsProducts.length} sports products`)

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
