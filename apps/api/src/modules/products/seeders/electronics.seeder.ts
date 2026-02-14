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

export async function seedElectronics(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product)

  const s3Configured = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  )

  let s3Client: S3Client | null = null
  if (s3Configured) {
    s3Client = createS3Client()
    console.log("📸 S3/MinIO configured - electronics images will be uploaded")
  } else {
    console.log("⚠️  S3/MinIO not configured - electronics images will be skipped")
  }

  const electronics = [
    {
      name: "ProBook 15 Laptop",
      summary: "15.6 inch laptop with Intel i7 and 16GB RAM",
      stockQuantity: 10,
      price: 129999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.LAPTOP,
      weightInKg: 1.8,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop",
    },
    {
      name: "Galaxy Nova Smartphone",
      summary: "6.7 inch AMOLED display with 108MP camera",
      stockQuantity: 25,
      price: 89999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.SMARTPHONE,
      weightInKg: 0.19,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop",
    },
    {
      name: "iPad Air Tablet 10.9 inch",
      summary: "Lightweight tablet with M1 chip and Retina display",
      stockQuantity: 15,
      price: 69999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.TABLET,
      weightInKg: 0.46,
      imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop",
    },
    {
      name: "SoundPro Wireless Headphones",
      summary: "Active noise cancelling over-ear headphones",
      stockQuantity: 30,
      price: 34999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.HEADPHONE,
      weightInKg: 0.25,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    },
    {
      name: "BassBlast Portable Speaker",
      summary: "Waterproof Bluetooth speaker with 24-hour battery",
      stockQuantity: 20,
      price: 14999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.SPEAKER,
      weightInKg: 0.54,
      imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=800&fit=crop",
    },
    {
      name: "PhotoPro Mirrorless Camera",
      summary: "24.2MP mirrorless camera with 4K video recording",
      stockQuantity: 8,
      price: 199999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.CAMERA,
      weightInKg: 0.65,
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop",
    },
    {
      name: "FitTrack Smartwatch Pro",
      summary: "GPS smartwatch with heart rate and SpO2 monitoring",
      stockQuantity: 22,
      price: 29999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.SMARTWATCH,
      weightInKg: 0.05,
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
    },
    {
      name: "MechType Mechanical Keyboard",
      summary: "RGB mechanical keyboard with Cherry MX switches",
      stockQuantity: 18,
      price: 12999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.KEYBOARD,
      weightInKg: 0.95,
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop",
    },
    {
      name: "PrecisionGlide Wireless Mouse",
      summary: "Ergonomic wireless mouse with 16000 DPI sensor",
      stockQuantity: 35,
      price: 7999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.MOUSE,
      weightInKg: 0.08,
      imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop",
    },
    {
      name: "UltraView 27 inch 4K Monitor",
      summary: "27 inch 4K IPS monitor with USB-C and HDR400",
      stockQuantity: 12,
      price: 54999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.MONITOR,
      weightInKg: 5.2,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&h=800&fit=crop",
    },
    {
      name: "ThinBook Air Laptop 13 inch",
      summary: "Ultra-thin 13 inch laptop with all-day battery life",
      stockQuantity: 14,
      price: 109999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.LAPTOP,
      weightInKg: 1.24,
      imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop",
    },
    {
      name: "EarBuds Pro Wireless",
      summary: "True wireless earbuds with spatial audio",
      stockQuantity: 40,
      price: 19999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.HEADPHONE,
      weightInKg: 0.006,
      imageUrl: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&h=800&fit=crop",
    },
    {
      name: "ActionCam 360 Camera",
      summary: "360-degree action camera with waterproof housing",
      stockQuantity: 9,
      price: 44999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.CAMERA,
      weightInKg: 0.15,
      imageUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop",
    },
    {
      name: "HomePod Mini Speaker",
      summary: "Smart home speaker with voice assistant support",
      stockQuantity: 28,
      price: 9999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.SPEAKER,
      weightInKg: 0.34,
      imageUrl: "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800&h=800&fit=crop",
    },
    {
      name: "GamingPro 34 inch Curved Monitor",
      summary: "34 inch ultrawide curved gaming monitor 165Hz",
      stockQuantity: 7,
      price: 79999,
      category: ProductCategory.ELECTRONICS,
      type: ProductType.MONITOR,
      weightInKg: 7.8,
      imageUrl: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&h=800&fit=crop",
    },
  ]

  const vatPercentage = 18
  const currency = Currency.RWF
  const country = Country.RWANDA

  let seededCount = 0
  let skippedCount = 0
  let imagesUploadedCount = 0
  let imagesFailedCount = 0

  for (let i = 0; i < electronics.length; i++) {
    const itemData = electronics[i]
    const slug = generateSlug(itemData.name)

    const existingProduct = await productRepository.findOne({ where: { slug } })

    let productToProcess: Product

    if (!existingProduct) {
      const product = productRepository.create({
        ...itemData,
        slug,
        description: `${itemData.name} - ${itemData.summary}. High-quality electronics designed for performance and reliability.`,
        vatPercentage,
        currency,
        country,
        isActive: true,
      })
      productToProcess = await productRepository.save(product)
      console.log(`✓ Seeded electronics: ${itemData.name} (${itemData.price} RWF)`)
      seededCount++
    } else {
      console.log(`- Electronics already exists: ${itemData.name}`)
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

  console.log(`\n💻 Electronics seeding completed!`)
  console.log(`   ✓ Seeded: ${seededCount} electronics`)
  console.log(`   - Skipped: ${skippedCount} electronics (already exist)`)
  console.log(`   📊 Total in file: ${electronics.length} electronics`)

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
