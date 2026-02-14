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

export async function seedClothing(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product)

  const s3Configured = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  )

  let s3Client: S3Client | null = null
  if (s3Configured) {
    s3Client = createS3Client()
    console.log("📸 S3/MinIO configured - clothing images will be uploaded")
  } else {
    console.log("⚠️  S3/MinIO not configured - clothing images will be skipped")
  }

  const clothing = [
    {
      name: "Classic Oxford Button-Down Shirt",
      summary: "Timeless cotton oxford shirt for everyday wear",
      stockQuantity: 30,
      price: 4999,
      category: ProductCategory.CLOTHING,
      type: ProductType.SHIRT,
      weightInKg: 0.25,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop",
    },
    {
      name: "Slim Fit Chino Pants",
      summary: "Comfortable stretch chinos with modern slim fit",
      stockQuantity: 25,
      price: 5999,
      category: ProductCategory.CLOTHING,
      type: ProductType.PANTS,
      weightInKg: 0.4,
      imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop",
    },
    {
      name: "Floral Summer Dress",
      summary: "Lightweight floral print dress for warm weather",
      stockQuantity: 20,
      price: 7999,
      category: ProductCategory.CLOTHING,
      type: ProductType.DRESS,
      weightInKg: 0.2,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=800&fit=crop",
    },
    {
      name: "Premium Denim Jacket",
      summary: "Classic denim jacket with vintage wash finish",
      stockQuantity: 15,
      price: 12999,
      category: ProductCategory.CLOTHING,
      type: ProductType.JACKET,
      weightInKg: 0.9,
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop",
    },
    {
      name: "Leather Chelsea Boots",
      summary: "Genuine leather Chelsea boots with elastic side panels",
      stockQuantity: 12,
      price: 18999,
      category: ProductCategory.CLOTHING,
      type: ProductType.SHOES,
      weightInKg: 1.2,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&h=800&fit=crop",
    },
    {
      name: "Wool Fedora Hat",
      summary: "Classic wool fedora with grosgrain ribbon band",
      stockQuantity: 18,
      price: 3999,
      category: ProductCategory.CLOTHING,
      type: ProductType.HAT,
      weightInKg: 0.15,
      imageUrl: "https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&h=800&fit=crop",
    },
    {
      name: "Merino Wool Dress Socks Pack",
      summary: "6-pack premium merino wool dress socks",
      stockQuantity: 50,
      price: 2499,
      category: ProductCategory.CLOTHING,
      type: ProductType.SOCKS,
      weightInKg: 0.18,
      imageUrl: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&h=800&fit=crop",
    },
    {
      name: "Linen Button-Up Shirt",
      summary: "Breathable linen shirt for hot summer days",
      stockQuantity: 22,
      price: 5499,
      category: ProductCategory.CLOTHING,
      type: ProductType.SHIRT,
      weightInKg: 0.2,
      imageUrl: "https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=800&h=800&fit=crop",
    },
    {
      name: "High-Waist Wide Leg Pants",
      summary: "Elegant wide-leg trousers with high waist",
      stockQuantity: 18,
      price: 6999,
      category: ProductCategory.CLOTHING,
      type: ProductType.PANTS,
      weightInKg: 0.35,
      imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&h=800&fit=crop",
    },
    {
      name: "Little Black Cocktail Dress",
      summary: "Elegant cocktail dress for special occasions",
      stockQuantity: 10,
      price: 14999,
      category: ProductCategory.CLOTHING,
      type: ProductType.DRESS,
      weightInKg: 0.3,
      imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=800&fit=crop",
    },
    {
      name: "Waterproof Rain Jacket",
      summary: "Lightweight waterproof jacket with sealed seams",
      stockQuantity: 16,
      price: 9999,
      category: ProductCategory.CLOTHING,
      type: ProductType.JACKET,
      weightInKg: 0.45,
      imageUrl: "https://images.unsplash.com/photo-1545594861-3bef43ff2fc8?w=800&h=800&fit=crop",
    },
    {
      name: "Canvas Sneakers Low Top",
      summary: "Casual low-top canvas sneakers in classic white",
      stockQuantity: 35,
      price: 4999,
      category: ProductCategory.CLOTHING,
      type: ProductType.SHOES,
      weightInKg: 0.7,
      imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop",
    },
    {
      name: "Cashmere V-Neck Sweater",
      summary: "Luxurious 100% cashmere V-neck sweater",
      stockQuantity: 8,
      price: 19999,
      category: ProductCategory.CLOTHING,
      type: ProductType.SHIRT,
      weightInKg: 0.35,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop",
    },
    {
      name: "Running Sneakers UltraLight",
      summary: "Performance running shoes with responsive cushioning",
      stockQuantity: 24,
      price: 15999,
      category: ProductCategory.CLOTHING,
      type: ProductType.SHOES,
      weightInKg: 0.56,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
    },
  ]

  const vatPercentage = 18
  const currency = Currency.RWF
  const country = Country.RWANDA

  let seededCount = 0
  let skippedCount = 0
  let imagesUploadedCount = 0
  let imagesFailedCount = 0

  for (let i = 0; i < clothing.length; i++) {
    const itemData = clothing[i]
    const slug = generateSlug(itemData.name)

    const existingProduct = await productRepository.findOne({ where: { slug } })

    let productToProcess: Product

    if (!existingProduct) {
      const product = productRepository.create({
        ...itemData,
        slug,
        description: `${itemData.name} - ${itemData.summary}. Quality clothing crafted for comfort and style.`,
        vatPercentage,
        currency,
        country,
        isActive: true,
      })
      productToProcess = await productRepository.save(product)
      console.log(`✓ Seeded clothing: ${itemData.name} (${itemData.price} RWF)`)
      seededCount++
    } else {
      console.log(`- Clothing already exists: ${itemData.name}`)
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

  console.log(`\n👕 Clothing seeding completed!`)
  console.log(`   ✓ Seeded: ${seededCount} clothing items`)
  console.log(`   - Skipped: ${skippedCount} clothing items (already exist)`)
  console.log(`   📊 Total in file: ${clothing.length} clothing items`)

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
