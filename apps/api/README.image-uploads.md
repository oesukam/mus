# Product Image Uploads Setup

This guide explains how to set up and test product image uploads during database seeding.

## Overview

The product seeder (`src/modules/products/seeders/books.seeder.ts`) automatically downloads and uploads placeholder images for each book product. Images are stored in S3-compatible storage (AWS S3 or MinIO).

## Features

- **Automatic Image Upload**: When seeding products, the seeder fetches placeholder images from [picsum.photos](https://picsum.photos) and uploads them to S3/MinIO
- **Product Images Table**: Images are linked to products via the `products_images` table
- **Graceful Degradation**: If S3 is not configured, the seeder will skip image uploads and only create product records
- **Consistent Placeholders**: Each book gets a unique but consistent placeholder image based on its title

## Setup Instructions

### Option 1: Local Development with MinIO (Recommended)

MinIO is an S3-compatible object storage server that runs locally via Docker.

#### 1. Start MinIO

```bash
cd apps/api
docker-compose -f docker-compose.minio.yml up -d
```

This will:
- Start MinIO server on `http://localhost:9000`
- Start MinIO Console on `http://localhost:9001`
- Automatically create a `products` bucket
- Set up public read access for product images

#### 2. Configure Environment Variables

Add these variables to your `.env` file:

```bash
# S3 Configuration for MinIO (local development)
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET_NAME=products
```

#### 3. Access MinIO Console (Optional)

- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`

You can browse uploaded images and manage buckets via the web interface.

### Option 2: AWS S3 (Production)

For production deployments using AWS S3:

#### 1. Create S3 Bucket

1. Log into AWS Console
2. Create a new S3 bucket (e.g., `your-app-products`)
3. Configure bucket permissions for public read access (if needed)

#### 2. Create IAM User

1. Create an IAM user with S3 permissions
2. Generate access keys

#### 3. Configure Environment Variables

Update your `.env` file:

```bash
# S3 Configuration for AWS S3 (production)
# Comment out or remove S3_ENDPOINT and S3_FORCE_PATH_STYLE
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=your-app-products
```

## Testing Image Uploads

### 1. Reset Database and Seed with Images

```bash
yarn db:reset
```

This will:
1. Drop and recreate the database schema
2. Run all migrations
3. Seed feature flags
4. Seed products with images (if S3 is configured)

### 2. Verify Images

**Check Console Output:**
```
📚 Seeding Products...
📸 S3/MinIO configured - images will be uploaded
✓ Seeded book: Atomic Habits (13850 RWF)
  📸 Image uploaded for: Atomic Habits
...

📚 Books seeding completed!
   ✓ Seeded: 63 books
   📊 Total in file: 63 books
   📸 Images uploaded: 63
```

**Check Database:**
```sql
-- View uploaded files
SELECT id, key, url, original_name, folder FROM files LIMIT 10;

-- View product images
SELECT pi.*, p.name as product_name
FROM products_images pi
JOIN products p ON pi.product_id = p.id
LIMIT 10;
```

**Check MinIO Console:**
1. Go to http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Browse the `products` bucket
4. You should see uploaded images

### 3. Test via API

```bash
# Get products with images
curl http://localhost:4000/api/v1/admin/products
```

The response will include image URLs in the product data.

## Image Utility Functions

The seeder uses utility functions from `src/database/utils/image-seeder.util.ts`:

### Key Functions

- **`getPlaceholderBookCover(title, index)`**: Generates a consistent placeholder image URL for each book
- **`fetchImageAsBuffer(url)`**: Downloads an image from a URL and converts it to a buffer
- **`downloadImage(url, filepath)`**: Downloads and saves an image to local filesystem
- **`fileToBuffer(filepath)`**: Converts a local file to buffer format for S3 upload

### Example Usage

```typescript
import { getPlaceholderBookCover, fetchImageAsBuffer } from './utils/image-seeder.util'

// Get placeholder image URL
const imageUrl = getPlaceholderBookCover("Atomic Habits", 0)
// Returns: https://picsum.photos/seed/123/600/900

// Fetch image as buffer
const imageBuffer = await fetchImageAsBuffer(imageUrl)
// Returns: { buffer, originalname, mimetype, size }

// Upload to S3 (handled by seeder)
await uploadProductImage(dataSource, s3Client, imageBuffer, productId)
```

## Troubleshooting

### Images Not Uploading

**Problem**: Seeder shows "S3/MinIO not configured - images will be skipped"

**Solution**:
1. Verify MinIO is running: `docker ps | grep minio`
2. Check environment variables in `.env`
3. Ensure all required S3 variables are set

### MinIO Connection Refused

**Problem**: Error connecting to MinIO during seeding

**Solution**:
1. Verify MinIO is running: `docker-compose -f docker-compose.minio.yml ps`
2. Check MinIO health: `curl http://localhost:9000/minio/health/live`
3. Restart MinIO: `docker-compose -f docker-compose.minio.yml restart`

### Bucket Does Not Exist

**Problem**: Error "The specified bucket does not exist"

**Solution**:
1. Check if bucket was created: Access http://localhost:9001
2. Manually create bucket:
   ```bash
   docker exec -it mus-minio-setup mc mb myminio/products --ignore-existing
   ```

### Image URLs Not Working

**Problem**: Image URLs return 404 or access denied

**Solution**:
1. Verify bucket has public read policy
2. Set policy via MinIO Console or CLI:
   ```bash
   docker exec -it mus-minio-setup mc anonymous set download myminio/products
   ```

## Using Real Book Covers

The current implementation uses placeholder images from picsum.photos. To use real book covers:

### Option 1: Open Library API

```typescript
// Get book cover from Open Library
function getOpenLibraryBookCover(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
}

// Add ISBN to book data
const books = [
  {
    name: "Atomic Habits",
    isbn: "9780735211292",
    // ... other fields
  }
]

// In seeder, use ISBN instead of index
const imageUrl = getOpenLibraryBookCover(bookData.isbn)
```

### Option 2: Manual Image Files

1. Place images in `src/database/seed-images/products/`
2. Name files: `book-1.jpg`, `book-2.jpg`, etc.
3. Update seeder to read from local files:

```typescript
import { fileToBuffer } from '../../../database/utils/image-seeder.util'
import { join } from 'path'

// In seeder loop
const imagePath = join(__dirname, '../../seed-images/products', `book-${i + 1}.jpg`)
if (existsSync(imagePath)) {
  const imageBuffer = fileToBuffer(imagePath)
  await uploadProductImage(dataSource, s3Client, imageBuffer, savedBook.id, 0, true)
}
```

## Architecture

```
┌─────────────────┐
│   Seeder        │
│  books.seeder   │
└────────┬────────┘
         │
         ├─── Fetches placeholder image from picsum.photos
         │
         ├─── Uploads to S3/MinIO
         │    (using S3UploadService logic)
         │
         ├─── Creates File record
         │    (files table)
         │
         └─── Creates ProductImage record
              (products_images table)

Database Tables:
┌────────────┐      ┌──────────────────┐      ┌────────┐
│  products  │◄─────│ products_images  │─────►│  files │
└────────────┘      └──────────────────┘      └────────┘
  id, name            product_id, file_id      id, url
```

## Clean Up

### Stop and Remove MinIO

```bash
cd apps/api
docker-compose -f docker-compose.minio.yml down

# To also remove volumes (deletes all stored images)
docker-compose -f docker-compose.minio.yml down -v
```

## Next Steps

1. **Add More Image Variations**: Upload multiple images per product (different angles, thumbnails)
2. **Image Optimization**: Add image resizing and optimization before upload
3. **CDN Integration**: Configure CloudFront or similar CDN for faster image delivery
4. **Image Validation**: Add checks for image size, format, and dimensions
5. **Batch Processing**: Optimize seeder to upload images in batches for better performance
