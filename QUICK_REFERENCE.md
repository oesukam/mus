# Quick Reference

## Common Commands

### Quick Setup (Recommended)

```bash
# Automated setup script
./setup-local.sh

# Cleanup script
./cleanup.sh
```

### Installation & Setup
```bash
# Install dependencies
pnpm install

# Start databases (Docker)
docker-compose up -d postgres redis

# Start all apps
pnpm dev

# Install new dependency in specific app
pnpm --filter @mus/api add package-name
pnpm --filter @mus/platform add package-name

# Install dev dependency
pnpm --filter @mus/api add -D package-name
```

### Development
```bash
# Run all apps
pnpm dev

# Run specific app
cd apps/platform && pnpm dev
cd apps/dashboard && pnpm dev
cd apps/api && pnpm dev
cd apps/blog && pnpm dev

# Build all
pnpm build

# Build specific app
pnpm --filter @mus/api build
```

### Testing
```bash
# All tests
pnpm test

# API unit tests
cd apps/api && pnpm test

# API E2E tests
cd apps/api && pnpm test:e2e

# API test coverage
cd apps/api && pnpm test:cov

# Watch mode
cd apps/api && pnpm test:watch
```

### Code Quality
```bash
# Lint all
pnpm lint

# Type check all
pnpm typecheck

# Format all
pnpm format
```

### Docker
```bash
# Start services (PostgreSQL & Redis don't expose ports to avoid conflicts)
docker-compose up -d

# Start specific service
docker-compose up -d postgres
docker-compose up -d redis

# View logs
docker-compose logs -f
docker-compose logs -f api

# Stop all
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Remove volumes
docker-compose down -v

# Note: PostgreSQL and Redis are accessible only via Docker network
# or using docker exec commands (see Database/Redis sections below)
```

### Database
```bash
# Connect to PostgreSQL (Docker)
docker exec -it mus-postgres psql -U postgres -d ecommerce

# Connect to PostgreSQL (Local)
psql -U postgres -d ecommerce

# Create database
docker exec -it mus-postgres psql -U postgres -c "CREATE DATABASE ecommerce;"

# Common SQL commands
\l              # List databases
\dt             # List tables
\d products     # Describe products table
\q              # Quit
```

### Redis
```bash
# Connect to Redis (Docker)
docker exec -it mus-redis redis-cli

# Connect to Redis (Local)
redis-cli

# Common Redis commands
KEYS *          # List all keys
GET key         # Get value
DEL key         # Delete key
FLUSHALL        # Clear all data
```

## Project Structure Reference

```
mus/
├── apps/
│   ├── platform/       # E-commerce store (Next.js)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   └── package.json
│   ├── dashboard/      # Admin panel (Next.js)
│   ├── api/           # Backend API (NestJS)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── products/
│   │   │   │   ├── users/
│   │   │   │   └── orders/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── test/
│   └── blog/          # Content blog (Next.js + Contentful)
├── packages/
│   ├── types/         # Shared types
│   ├── ui/           # Shared components
│   └── config/       # Shared config
└── docker-compose.yml
```

## API Endpoints

### Products
```
GET    /products        # List all products
GET    /products/:id    # Get product by ID
POST   /products        # Create product
PATCH  /products/:id    # Update product
DELETE /products/:id    # Delete product
```

### Users
```
GET    /users          # List all users
GET    /users/:id      # Get user by ID
```

### Orders
```
GET    /orders         # List all orders
GET    /orders/:id     # Get order by ID
GET    /orders/user/:userId  # Get orders by user
```

## Environment Variables

### API (.env)
```env
NODE_ENV=development
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=ecommerce
REDIS_HOST=localhost
REDIS_PORT=6379
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Platform/Dashboard (.env.local)
```env
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Blog (.env.local)
```env
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_access_token
```

## Port Reference

| Application | Port | URL | Notes |
|------------|------|-----|-------|
| Platform | 3000 | http://localhost:3000 | |
| Dashboard | 3001 | http://localhost:3001 | |
| Blog | 3002 | http://localhost:3002 | |
| API | 4000 | http://localhost:4000 | |
| API Docs | 4000 | http://localhost:4000/api/docs | |
| PostgreSQL | 5432 | localhost:5432 | Local only; Docker uses internal network |
| Redis | 6379 | localhost:6379 | Local only; Docker uses internal network |

**Docker Note:** PostgreSQL and Redis containers don't expose ports to the host. Access them using:
- `docker exec -it mus-postgres psql -U postgres -d ecommerce`
- `docker exec -it mus-redis redis-cli`

## Useful API Requests

### Create Product
```bash
curl -X POST http://localhost:4000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro",
    "description": "14-inch M3 Pro",
    "price": 1999.99,
    "stock": 10,
    "category": "electronics"
  }'
```

### Get All Products
```bash
curl http://localhost:4000/products
```

### Get Product by ID
```bash
curl http://localhost:4000/products/1
```

### Update Product
```bash
curl -X PATCH http://localhost:4000/products/1 \
  -H "Content-Type: application/json" \
  -d '{"price": 1899.99}'
```

### Delete Product
```bash
curl -X DELETE http://localhost:4000/products/1
```

## Troubleshooting

### Reset Database
```bash
docker-compose down -v
docker-compose up -d postgres
```

### Clear Redis Cache
```bash
docker exec -it mus-redis redis-cli FLUSHALL
```

### Reset Node Modules
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Clear Build Cache
```bash
pnpm clean
rm -rf .turbo
pnpm install
```

### View API Logs
```bash
cd apps/api && pnpm dev
# Or with Docker
docker-compose logs -f api
```

## Package Manager Commands

### pnpm workspace commands
```bash
# Run command in all workspaces
pnpm -r <command>

# Run command in specific workspace
pnpm --filter @mus/api <command>

# Add dependency to workspace
pnpm --filter @mus/api add express

# Remove dependency
pnpm --filter @mus/api remove express

# Update all dependencies
pnpm -r update

# List outdated packages
pnpm outdated
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/product-search

# Develop and test
pnpm dev
pnpm test

# Commit changes
git add .
git commit -m "feat: add product search"

# Push to remote
git push origin feature/product-search

# After review, merge to main
git checkout main
git merge feature/product-search
```

## Production Build

```bash
# Build all apps
pnpm build

# Test production build
cd apps/platform && pnpm build && pnpm start
cd apps/api && pnpm build && pnpm start:prod

# Docker production build
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring Commands

```bash
# Check all services
docker-compose ps

# Check database connection
psql -U postgres -h localhost -c "SELECT 1"

# Check Redis connection
redis-cli ping

# Check API health
curl http://localhost:4000/

# Monitor logs
docker-compose logs -f --tail=100
```
