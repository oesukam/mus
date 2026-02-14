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

export async function seedBags(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product)

  const s3Configured = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  )

  let s3Client: S3Client | null = null
  if (s3Configured) {
    s3Client = createS3Client()
    console.log("📸 S3/MinIO configured - bag images will be uploaded")
  } else {
    console.log("⚠️  S3/MinIO not configured - bag images will be skipped")
  }

  const bags = [
    {
      name: "Urban Explorer Backpack",
      summary: "Durable everyday backpack with laptop compartment",
      stockQuantity: 15,
      price: 7999,
      category: ProductCategory.BAGS,
      type: ProductType.BACKPACK,
      weightInKg: 0.8,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
    },
    {
      name: "Summit Trail Hiking Backpack 45L",
      summary: "Large capacity hiking backpack with rain cover",
      stockQuantity: 8,
      price: 12999,
      category: ProductCategory.BAGS,
      type: ProductType.BACKPACK,
      weightInKg: 1.4,
      imageUrl: "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=800&h=800&fit=crop",
    },
    {
      name: "Milano Leather Handbag",
      summary: "Premium Italian leather handbag with gold hardware",
      stockQuantity: 5,
      price: 24999,
      category: ProductCategory.BAGS,
      type: ProductType.HANDBAG,
      weightInKg: 0.6,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop",
    },
    {
      name: "Classic Canvas Tote Bag",
      summary: "Eco-friendly canvas tote for everyday use",
      stockQuantity: 25,
      price: 2999,
      category: ProductCategory.BAGS,
      type: ProductType.TOTE_BAG,
      weightInKg: 0.3,
      imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&h=800&fit=crop",
    },
    {
      name: "ProTech Laptop Bag 15.6 inch",
      summary: "Padded laptop bag with multiple compartments",
      stockQuantity: 20,
      price: 5999,
      category: ProductCategory.BAGS,
      type: ProductType.LAPTOP_BAG,
      weightInKg: 0.9,
      imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop",
    },
    {
      name: "Vintage Messenger Bag",
      summary: "Retro-style waxed canvas messenger bag",
      stockQuantity: 12,
      price: 8999,
      category: ProductCategory.BAGS,
      type: ProductType.MESSENGER_BAG,
      weightInKg: 0.7,
      imageUrl: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&h=800&fit=crop",
    },
    {
      name: "Globe Trotter Travel Duffel",
      summary: "Spacious travel duffel with shoe compartment",
      stockQuantity: 10,
      price: 15999,
      category: ProductCategory.BAGS,
      type: ProductType.TRAVEL_BAG,
      weightInKg: 1.8,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
    },
    {
      name: "Mini Crossbody Handbag",
      summary: "Compact crossbody bag for essentials",
      stockQuantity: 18,
      price: 3999,
      category: ProductCategory.BAGS,
      type: ProductType.HANDBAG,
      weightInKg: 0.25,
      imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=800&fit=crop",
    },
    {
      name: "Commuter Roll-Top Backpack",
      summary: "Waterproof roll-top backpack for city commuters",
      stockQuantity: 14,
      price: 9999,
      category: ProductCategory.BAGS,
      type: ProductType.BACKPACK,
      weightInKg: 0.95,
      imageUrl: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&h=800&fit=crop",
    },
    {
      name: "Executive Leather Laptop Bag",
      summary: "Professional leather laptop briefcase",
      stockQuantity: 7,
      price: 18999,
      category: ProductCategory.BAGS,
      type: ProductType.LAPTOP_BAG,
      weightInKg: 1.1,
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
    },
    {
      name: "Weekend Getaway Tote",
      summary: "Oversized tote bag for weekend trips",
      stockQuantity: 16,
      price: 4999,
      category: ProductCategory.BAGS,
      type: ProductType.TOTE_BAG,
      weightInKg: 0.5,
      imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&h=800&fit=crop",
    },
    {
      name: "Adventure Pro Travel Backpack 60L",
      summary: "Heavy-duty travel backpack with frame support",
      stockQuantity: 6,
      price: 19999,
      category: ProductCategory.BAGS,
      type: ProductType.TRAVEL_BAG,
      weightInKg: 2.2,
      imageUrl: "https://images.unsplash.com/photo-1622260614153-03223fb72052?w=800&h=800&fit=crop",
    },
  ]

  const vatPercentage = 18
  const currency = Currency.RWF
  const country = Country.RWANDA

  let seededCount = 0
  let skippedCount = 0
  let imagesUploadedCount = 0
  let imagesFailedCount = 0

  for (let i = 0; i < bags.length; i++) {
    const bagData = bags[i]
    const slug = generateSlug(bagData.name)

    const existingProduct = await productRepository.findOne({ where: { slug } })

    let productToProcess: Product

    if (!existingProduct) {
      const product = productRepository.create({
        ...bagData,
        slug,
        description: `${bagData.name} - ${bagData.summary}. Premium quality bag designed for style and functionality.`,
        vatPercentage,
        currency,
        country,
        isActive: true,
      })
      productToProcess = await productRepository.save(product)
      console.log(`✓ Seeded bag: ${bagData.name} (${bagData.price} RWF)`)
      seededCount++
    } else {
      console.log(`- Bag already exists: ${bagData.name}`)
      productToProcess = existingProduct
      skippedCount++
    }

    if (s3Configured && s3Client && !productToProcess.coverImageId) {
      try {
        const imageBuffer = await getCachedProductImageAsBuffer(bagData.name, i, bagData.imageUrl)
        const thumbnailBuffer = await getCachedProductThumbnailAsBuffer(
          bagData.name,
          i,
          bagData.imageUrl,
        )
        const mediumBuffer = await getCachedProductMediumAsBuffer(bagData.name, i, bagData.imageUrl)
        const largeBuffer = await getCachedProductLargeAsBuffer(bagData.name, i, bagData.imageUrl)

        await uploadProductImage(
          dataSource,
          s3Client,
          imageBuffer,
          thumbnailBuffer,
          mediumBuffer,
          largeBuffer,
          productToProcess.id,
          bagData.name,
          0,
          true,
        )
        console.log(`  📸 All image sizes uploaded for: ${bagData.name}`)
        imagesUploadedCount++
      } catch (error) {
        console.error(
          `  ✗ Image upload failed for: ${bagData.name}`,
          error instanceof Error ? error.message : error,
        )
        imagesFailedCount++
      }
    } else if (productToProcess.coverImageId) {
      console.log(`  - Image already exists for: ${bagData.name}`)
    }
  }

  console.log(`\n👜 Bags seeding completed!`)
  console.log(`   ✓ Seeded: ${seededCount} bags`)
  console.log(`   - Skipped: ${skippedCount} bags (already exist)`)
  console.log(`   📊 Total in file: ${bags.length} bags`)

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
