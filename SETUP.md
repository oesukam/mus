# Setup Guide

## Quick Start

Follow these steps to get the monorepo up and running:

### 1. Install pnpm (if not already installed)

```bash
npm install -g pnpm@9.14.2
```

### 2. Install all dependencies

```bash
pnpm install
```

### 3. Set up PostgreSQL and Redis

#### Option A: Using Docker (Easiest)

```bash
docker-compose up -d postgres redis
```

**Important:** Docker containers don't expose PostgreSQL and Redis ports to avoid conflicts with local installations. They're accessible only via Docker network or using:
```bash
# Access PostgreSQL
docker exec -it mus-postgres psql -U postgres -d ecommerce

# Access Redis
docker exec -it mus-redis redis-cli
```

When using Docker, keep `DB_HOST=postgres` and `REDIS_HOST=redis` in `apps/api/.env` (Docker network names).

#### Option B: Local Installation

**macOS (using Homebrew):**
```bash
brew install postgresql@15 redis
brew services start postgresql@15
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql-15 redis-server
sudo systemctl start postgresql
sudo systemctl start redis
```

### 4. Configure Environment Variables

#### Backend API
```bash
cd apps/api
cp .env.example .env
```

Edit `apps/api/.env`:
```env
NODE_ENV=development
PORT=4000
# For Docker: use DB_HOST=postgres and REDIS_HOST=redis
# For Local: use DB_HOST=localhost and REDIS_HOST=localhost
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ecommerce
REDIS_HOST=redis
REDIS_PORT=6379
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### Platform
```bash
cd apps/platform
cp .env.example .env.local
```

#### Blog (Optional - only if using Contentful)
```bash
cd apps/blog
cp .env.example .env.local
```

Edit `apps/blog/.env.local` with your Contentful credentials:
```env
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_access_token
```

### 5. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ecommerce;

# Exit
\q
```

Or using Docker:
```bash
docker exec -it mus-postgres psql -U postgres -c "CREATE DATABASE ecommerce;"
```

### 6. Start Development Servers

From the root directory:
```bash
pnpm dev
```

This will start all applications:
- Platform: http://localhost:3000
- Dashboard: http://localhost:3001
- Blog: http://localhost:3002
- API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs

## Running Individual Apps

```bash
# Platform only
cd apps/platform && pnpm dev

# Dashboard only
cd apps/dashboard && pnpm dev

# API only
cd apps/api && pnpm dev

# Blog only
cd apps/blog && pnpm dev
```

## Testing the API

### 1. Using Swagger UI

Navigate to http://localhost:4000/api/docs

### 2. Using curl

Create a product:
```bash
curl -X POST http://localhost:4000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "price": 99.99,
    "stock": 10,
    "category": "electronics"
  }'
```

Get all products:
```bash
curl http://localhost:4000/products
```

### 3. Running Tests

Unit tests:
```bash
cd apps/api
pnpm test
```

E2E tests (requires database):
```bash
cd apps/api
pnpm test:e2e
```

Coverage report:
```bash
cd apps/api
pnpm test:cov
```

## Contentful Blog Setup (Optional)

### 1. Create Contentful Account
- Go to https://www.contentful.com
- Sign up for a free account
- Create a new space

### 2. Create Content Model

In Contentful dashboard:
1. Go to "Content model"
2. Create new content type called "Blog Post"
3. Add these fields:

| Field Name | Field ID | Type | Validation |
|------------|----------|------|------------|
| Title | title | Short text | Required |
| Slug | slug | Short text | Required, Unique |
| Excerpt | excerpt | Long text | Required |
| Content | content | Rich text | Required |
| Cover Image | coverImage | Media | - |
| Author | author | Short text | Required |
| Publish Date | publishDate | Date & time | Required |

### 3. Create Sample Content

1. Go to "Content"
2. Add entry → Blog Post
3. Fill in all fields
4. Publish

### 4. Get API Credentials

1. Go to Settings → API keys
2. Create new key (or use existing)
3. Copy "Space ID" and "Content Delivery API - access token"
4. Add to `apps/blog/.env.local`

## Building for Production

```bash
# Build all apps
pnpm build

# Build specific app
cd apps/platform && pnpm build
cd apps/dashboard && pnpm build
cd apps/api && pnpm build
cd apps/blog && pnpm build
```

## Docker Production Build

```bash
# Build and run all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Troubleshooting

### Port already in use

If you get "port already in use" errors, you can change the ports in each app's `package.json`:

```json
"dev": "next dev -p 3000"  // Change to another port
```

### Database connection failed

1. Check if PostgreSQL is running:
```bash
# Docker
docker ps | grep postgres

# Local
pg_isready
```

2. Verify credentials in `apps/api/.env`
3. Check if database exists:
```bash
psql -U postgres -l
```

### Redis connection failed

1. Check if Redis is running:
```bash
# Docker
docker ps | grep redis

# Local
redis-cli ping
# Should return: PONG
```

### pnpm install fails

1. Clear cache:
```bash
pnpm store prune
```

2. Delete node_modules and lock file:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors

```bash
# Run type checking
pnpm typecheck

# Or per app
cd apps/platform && pnpm typecheck
```

## Next Steps

1. Explore the API documentation at http://localhost:4000/api/docs
2. Create products, users, and orders using the API
3. Customize the frontend apps in `apps/platform` and `apps/dashboard`
4. Add your own modules to the backend in `apps/api/src/modules`
5. Create shared components in `packages/ui`
6. Add shared types in `packages/types`

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Contentful Documentation](https://www.contentful.com/developers/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
