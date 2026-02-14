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

export async function seedAccessories(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product)

  const s3Configured = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  )

  let s3Client: S3Client | null = null
  if (s3Configured) {
    s3Client = createS3Client()
    console.log("📸 S3/MinIO configured - accessories images will be uploaded")
  } else {
    console.log("⚠️  S3/MinIO not configured - accessories images will be skipped")
  }

  const accessories = [
    {
      name: "Classic Chronograph Watch",
      summary: "Stainless steel chronograph with leather strap",
      stockQuantity: 10,
      price: 29999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.WATCH,
      weightInKg: 0.09,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=800&fit=crop",
    },
    {
      name: "Aviator Polarized Sunglasses",
      summary: "UV400 polarized aviator sunglasses with metal frame",
      stockQuantity: 20,
      price: 12999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.SUNGLASSES,
      weightInKg: 0.03,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop",
    },
    {
      name: "Full Grain Leather Belt",
      summary: "Handcrafted full grain leather belt with brass buckle",
      stockQuantity: 25,
      price: 4999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.BELT,
      weightInKg: 0.15,
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
    },
    {
      name: "Slim Bifold Leather Wallet",
      summary: "RFID blocking slim bifold wallet with 8 card slots",
      stockQuantity: 30,
      price: 3999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.WALLET,
      weightInKg: 0.06,
      imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop",
    },
    {
      name: "Sterling Silver Chain Necklace",
      summary: "925 sterling silver Cuban link chain necklace",
      stockQuantity: 15,
      price: 8999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.JEWELRY,
      weightInKg: 0.025,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&h=800&fit=crop",
    },
    {
      name: "Cashmere Winter Scarf",
      summary: "100% cashmere scarf in classic plaid pattern",
      stockQuantity: 12,
      price: 7999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.SCARF,
      weightInKg: 0.12,
      imageUrl: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&h=800&fit=crop",
    },
    {
      name: "Dive Watch 200M Water Resistant",
      summary: "Professional dive watch with rotating bezel",
      stockQuantity: 8,
      price: 44999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.WATCH,
      weightInKg: 0.12,
      imageUrl: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&h=800&fit=crop",
    },
    {
      name: "Retro Round Sunglasses",
      summary: "Vintage-inspired round frame sunglasses",
      stockQuantity: 22,
      price: 8999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.SUNGLASSES,
      weightInKg: 0.025,
      imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop",
    },
    {
      name: "Reversible Dress Belt",
      summary: "Two-tone reversible leather belt black and brown",
      stockQuantity: 20,
      price: 3999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.BELT,
      weightInKg: 0.14,
      imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&h=800&fit=crop",
    },
    {
      name: "Zip-Around Travel Wallet",
      summary: "Full zip travel wallet with passport holder",
      stockQuantity: 18,
      price: 5999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.WALLET,
      weightInKg: 0.12,
      imageUrl: "https://images.unsplash.com/photo-1624996379697-f01d168b1a52?w=800&h=800&fit=crop",
    },
    {
      name: "Gold Hoop Earrings",
      summary: "14K gold-plated hoop earrings medium size",
      stockQuantity: 25,
      price: 6999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.JEWELRY,
      weightInKg: 0.01,
      imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop",
    },
    {
      name: "Silk Scarf Floral Print",
      summary: "Luxurious silk scarf with hand-painted floral design",
      stockQuantity: 14,
      price: 9999,
      category: ProductCategory.ACCESSORIES,
      type: ProductType.SCARF,
      weightInKg: 0.05,
      imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop",
    },
  ]

  const vatPercentage = 18
  const currency = Currency.RWF
  const country = Country.RWANDA

  let seededCount = 0
  let skippedCount = 0
  let imagesUploadedCount = 0
  let imagesFailedCount = 0

  for (let i = 0; i < accessories.length; i++) {
    const itemData = accessories[i]
    const slug = generateSlug(itemData.name)

    const existingProduct = await productRepository.findOne({ where: { slug } })

    let productToProcess: Product

    if (!existingProduct) {
      const product = productRepository.create({
        ...itemData,
        slug,
        description: `${itemData.name} - ${itemData.summary}. Elevate your look with this premium accessory.`,
        vatPercentage,
        currency,
        country,
        isActive: true,
      })
      productToProcess = await productRepository.save(product)
      console.log(`✓ Seeded accessory: ${itemData.name} (${itemData.price} RWF)`)
      seededCount++
    } else {
      console.log(`- Accessory already exists: ${itemData.name}`)
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

  console.log(`\n💎 Accessories seeding completed!`)
  console.log(`   ✓ Seeded: ${seededCount} accessories`)
  console.log(`   - Skipped: ${skippedCount} accessories (already exist)`)
  console.log(`   📊 Total in file: ${accessories.length} accessories`)

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
