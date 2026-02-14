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

export async function seedHome(dataSource: DataSource) {
  const productRepository = dataSource.getRepository(Product)

  const s3Configured = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET_NAME
  )

  let s3Client: S3Client | null = null
  if (s3Configured) {
    s3Client = createS3Client()
    console.log("📸 S3/MinIO configured - home product images will be uploaded")
  } else {
    console.log("⚠️  S3/MinIO not configured - home product images will be skipped")
  }

  const homeProducts = [
    {
      name: "Mid-Century Modern Coffee Table",
      summary: "Walnut veneer coffee table with tapered legs",
      stockQuantity: 6,
      price: 34999,
      category: ProductCategory.HOME,
      type: ProductType.FURNITURE,
      weightInKg: 18.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&h=800&fit=crop",
    },
    {
      name: "Abstract Canvas Wall Art Set",
      summary: "Set of 3 abstract canvas prints in earth tones",
      stockQuantity: 12,
      price: 7999,
      category: ProductCategory.HOME,
      type: ProductType.DECOR,
      weightInKg: 2.5,
      imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=800&fit=crop",
    },
    {
      name: "Cast Iron Dutch Oven 5.5 Qt",
      summary: "Enameled cast iron Dutch oven for slow cooking",
      stockQuantity: 15,
      price: 12999,
      category: ProductCategory.HOME,
      type: ProductType.KITCHEN,
      weightInKg: 5.8,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1585837146751-a44118595680?w=800&h=800&fit=crop",
    },
    {
      name: "Egyptian Cotton Bed Sheet Set",
      summary: "1000 thread count Egyptian cotton sheet set queen",
      stockQuantity: 20,
      price: 14999,
      category: ProductCategory.HOME,
      type: ProductType.BEDDING,
      weightInKg: 1.8,
      imageUrl: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&h=800&fit=crop",
    },
    {
      name: "Scandinavian Pendant Light",
      summary: "Minimalist wooden pendant lamp with fabric shade",
      stockQuantity: 10,
      price: 8999,
      category: ProductCategory.HOME,
      type: ProductType.LIGHTING,
      weightInKg: 1.2,
      imageUrl: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&h=800&fit=crop",
    },
    {
      name: "Velvet Accent Armchair",
      summary: "Plush velvet accent chair with gold metal legs",
      stockQuantity: 5,
      price: 49999,
      category: ProductCategory.HOME,
      type: ProductType.FURNITURE,
      weightInKg: 14.0,
      isFeatured: true,
      imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=800&fit=crop",
    },
    {
      name: "Ceramic Vase Collection",
      summary: "Set of 3 handcrafted ceramic vases in matte finish",
      stockQuantity: 18,
      price: 4999,
      category: ProductCategory.HOME,
      type: ProductType.DECOR,
      weightInKg: 1.5,
      imageUrl: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800&h=800&fit=crop",
    },
    {
      name: "Professional Chef Knife Set",
      summary: "7-piece German steel knife set with block",
      stockQuantity: 10,
      price: 19999,
      category: ProductCategory.HOME,
      type: ProductType.KITCHEN,
      weightInKg: 3.2,
      imageUrl: "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&h=800&fit=crop",
    },
    {
      name: "Luxury Down Comforter King",
      summary: "Hungarian white goose down comforter all-season",
      stockQuantity: 8,
      price: 24999,
      category: ProductCategory.HOME,
      type: ProductType.BEDDING,
      weightInKg: 2.8,
      imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&h=800&fit=crop",
    },
    {
      name: "Industrial Floor Lamp",
      summary: "Adjustable industrial floor lamp with Edison bulb",
      stockQuantity: 14,
      price: 11999,
      category: ProductCategory.HOME,
      type: ProductType.LIGHTING,
      weightInKg: 3.5,
      imageUrl: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&h=800&fit=crop",
    },
    {
      name: "Bamboo Bookshelf 5-Tier",
      summary: "Sustainable bamboo bookshelf with adjustable shelves",
      stockQuantity: 7,
      price: 22999,
      category: ProductCategory.HOME,
      type: ProductType.FURNITURE,
      weightInKg: 12.0,
      imageUrl: "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800&h=800&fit=crop",
    },
    {
      name: "Stainless Steel Cookware Set 10-Piece",
      summary: "Tri-ply stainless steel cookware with tempered glass lids",
      stockQuantity: 9,
      price: 29999,
      category: ProductCategory.HOME,
      type: ProductType.KITCHEN,
      weightInKg: 8.5,
      imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop",
    },
  ]

  const vatPercentage = 18
  const currency = Currency.RWF
  const country = Country.RWANDA

  let seededCount = 0
  let skippedCount = 0
  let imagesUploadedCount = 0
  let imagesFailedCount = 0

  for (let i = 0; i < homeProducts.length; i++) {
    const itemData = homeProducts[i]
    const slug = generateSlug(itemData.name)

    const existingProduct = await productRepository.findOne({ where: { slug } })

    let productToProcess: Product

    if (!existingProduct) {
      const product = productRepository.create({
        ...itemData,
        slug,
        description: `${itemData.name} - ${itemData.summary}. Transform your living space with this premium home product.`,
        vatPercentage,
        currency,
        country,
        isActive: true,
      })
      productToProcess = await productRepository.save(product)
      console.log(`✓ Seeded home product: ${itemData.name} (${itemData.price} RWF)`)
      seededCount++
    } else {
      console.log(`- Home product already exists: ${itemData.name}`)
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

  console.log(`\n🏠 Home products seeding completed!`)
  console.log(`   ✓ Seeded: ${seededCount} home products`)
  console.log(`   - Skipped: ${skippedCount} home products (already exist)`)
  console.log(`   📊 Total in file: ${homeProducts.length} home products`)

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
