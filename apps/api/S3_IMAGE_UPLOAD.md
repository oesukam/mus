# Product Image Upload to S3 / MinIO

This document explains how to use the S3-compatible image upload feature for product management.

## Overview

The API supports uploading product images to S3-compatible storage (Amazon S3 or MinIO). This feature is restricted to admin users only.

**Local Development**: Uses MinIO (self-hosted S3-compatible storage)
**Production**: Can use Amazon S3 or any S3-compatible service

## Features

- Upload product images to S3
- Automatic image validation (file type and size)
- Old image cleanup when uploading a new image
- Support for JPEG, PNG, and WebP formats
- Maximum file size: 5MB

## Setup

### Option 1: MinIO (Local Development - Recommended)

MinIO is included in the `docker-compose.yml` and is the default for local development.

#### 1. Run the Setup Script

The easiest way to set up MinIO and all other services is to run the setup script:

```bash
./setup-local.sh
```

This will:
- Start MinIO with Docker Compose
- Create the `products` bucket using Docker (no local installation needed!)
- Set public download policy

#### 2. Manual Setup (Alternative)

If you prefer to set up MinIO manually:

```bash
# Start MinIO
docker-compose up -d minio

# Wait for MinIO to be ready
sleep 5

# Use MinIO Client via Docker (no local installation needed!)
# Configure alias and create bucket
docker run --rm --network mus_mus-network \
  --entrypoint /bin/sh \
  minio/mc:latest \
  -c "mc alias set myminio http://minio:9000 minioadmin minioadmin"

# Create bucket
docker run --rm --network mus_mus-network \
  minio/mc:latest \
  mb myminio/products --ignore-existing

# Set public download policy
docker run --rm --network mus_mus-network \
  minio/mc:latest \
  anonymous set download myminio/products
```

**Note**: All MinIO Client (mc) commands are run via Docker, so you don't need to install anything locally!

#### 3. Access MinIO Console

- **Console UI**: http://localhost:9001
- **API Endpoint**: http://localhost:9000
- **Username**: minioadmin
- **Password**: minioadmin

#### 4. Environment Variables

The docker-compose automatically sets these for the API container:

```bash
S3_ENDPOINT=http://minio:9000
S3_FORCE_PATH_STYLE=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET_NAME=products
```

For local development outside Docker, use:

```bash
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET_NAME=products
```

### Option 2: AWS S3 (Production)

#### 1. Configure AWS Credentials

Add the following environment variables to your `.env` file:

```bash
# Leave S3_ENDPOINT and S3_FORCE_PATH_STYLE unset for AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

#### 2. S3 Bucket Configuration

Ensure your S3 bucket has the following settings:

- **Public access**: Enable public read access for uploaded images
- **CORS configuration**: If accessing from a web application, configure CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": []
  }
]
```

- **Bucket Policy**: Set public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## API Endpoints

### Upload Product Image

**Endpoint**: `POST /products/:id/upload-image`

**Authentication**: Required (JWT Token)

**Authorization**: Admin role required

**Content-Type**: `multipart/form-data`

**Parameters**:
- `id` (path): Product ID
- `image` (file): Image file to upload

**Supported formats**: JPEG, PNG, WebP

**Max file size**: 5MB

**Example using cURL**:

```bash
curl -X POST \
  http://localhost:4000/products/1/upload-image \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -F 'image=@/path/to/your/image.jpg'
```

**Example using JavaScript (fetch)**:

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch('http://localhost:4000/products/1/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

**Response**:

```json
{
  "message": "Image uploaded successfully",
  "product": {
    "id": 1,
    "name": "Product Name",
    "imageUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/products/uuid.jpg",
    ...
  },
  "imageUrl": "https://your-bucket.s3.us-east-1.amazonaws.com/products/uuid.jpg"
}
```

## Error Responses

### 400 Bad Request
- No file uploaded
- Invalid file type
- File size too large

```json
{
  "statusCode": 400,
  "message": "Invalid file type. Only JPEG, PNG, and WebP images are allowed",
  "error": "Bad Request"
}
```

### 403 Forbidden
- User is not authenticated
- User does not have admin role

```json
{
  "statusCode": 403,
  "message": "User does not have the required role(s): admin",
  "error": "Forbidden"
}
```

### 404 Not Found
- Product not found

```json
{
  "statusCode": 404,
  "message": "Product with ID 1 not found",
  "error": "Not Found"
}
```

## Admin-Only Endpoints

The following product endpoints now require admin role:

- `POST /products` - Create a new product
- `POST /products/:id/upload-image` - Upload product image
- `PATCH /products/:id` - Update a product
- `DELETE /products/:id` - Delete a product

## Role Management

To set a user as admin, update the user's role in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Default roles:
- `customer` - Regular users (default)
- `admin` - Administrators with full access

## Testing

### Quick Start with Docker

1. Run the setup script (recommended):
   ```bash
   ./setup-local.sh
   ```

   Or start services manually:
   ```bash
   docker-compose up -d
   ```

2. Access the API at `http://localhost:4000`

### Using Swagger UI

1. Navigate to `http://localhost:4000/api`
2. Authenticate using the `/auth/login` endpoint
3. Use the JWT token in the "Authorize" button
4. Try the `POST /products/:id/upload-image` endpoint

### Using Postman

1. Create a POST request to `http://localhost:4000/products/1/upload-image`
2. Set Authorization header: `Bearer YOUR_JWT_TOKEN`
3. In Body tab, select `form-data`
4. Add a key named `image` with type `File`
5. Choose your image file
6. Send the request

## Architecture

### Components

1. **S3UploadService** (`src/common/services/s3-upload.service.ts`)
   - Handles file uploads to S3
   - Manages file deletion
   - Generates unique file names using UUID

2. **RolesGuard** (`src/modules/auth/guards/roles.guard.ts`)
   - Validates user roles
   - Enforces role-based access control

3. **Roles Decorator** (`src/modules/auth/decorators/roles.decorator.ts`)
   - Marks endpoints with required roles

4. **CommonModule** (`src/common/common.module.ts`)
   - Exports S3UploadService globally
   - Shared across all modules

## Best Practices

1. **Security**
   - Never commit AWS credentials to version control
   - Use IAM roles with minimal required permissions
   - Enable MFA for AWS accounts

2. **Image Optimization**
   - Consider resizing images before upload (client-side)
   - Use WebP format for better compression
   - Implement image CDN for better performance

3. **Error Handling**
   - Always handle S3 errors gracefully
   - Log errors for debugging
   - Provide meaningful error messages to users

4. **Cost Management**
   - Implement image cleanup for deleted products
   - Set S3 lifecycle policies for unused images
   - Monitor S3 storage costs

## MinIO Client Commands (via Docker)

All MinIO Client commands can be run via Docker without local installation:

```bash
# List files in products bucket
docker run --rm --network mus_mus-network \
  minio/mc:latest \
  ls myminio/products

# Copy file to bucket
docker run --rm --network mus_mus-network \
  -v $(pwd):/data \
  minio/mc:latest \
  cp /data/myfile.jpg myminio/products/

# Remove file from bucket
docker run --rm --network mus_mus-network \
  minio/mc:latest \
  rm myminio/products/myfile.jpg

# Get bucket statistics
docker run --rm --network mus_mus-network \
  minio/mc:latest \
  du myminio/products

# View bucket policy
docker run --rm --network mus_mus-network \
  minio/mc:latest \
  anonymous get myminio/products
```

**Tip**: Create a shell alias for easier usage:
```bash
alias minio-mc='docker run --rm --network mus_mus-network minio/mc:latest'
# Then use: minio-mc ls myminio/products
```

## Troubleshooting

### "Access Denied" Error

Check:
- AWS credentials are correct
- IAM user has S3 permissions
- Bucket name is correct
- For MinIO: ensure bucket exists and policy is set

### Images Not Accessible

Check:
- Bucket has public read access
- Bucket policy allows public access
- Images are uploaded with public-read ACL (AWS only)
- For MinIO: run `anonymous get myminio/products` to verify policy

### "File size too large" Error

- Current limit is 5MB for products
- To change, update `maxSize` in `products.controller.ts`

### MinIO Network Issues

If you get connection errors:
- Ensure MinIO container is running: `docker ps | grep minio`
- Check network exists: `docker network ls | grep mus_mus-network`
- Restart MinIO: `docker-compose restart minio`

## Future Enhancements

- [ ] Image resizing and optimization
- [ ] Support for multiple images per product
- [ ] Image compression before upload
- [ ] CDN integration
- [ ] Temporary signed URLs for private images
- [ ] Image cropping and editing
