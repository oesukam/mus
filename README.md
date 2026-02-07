# E-Commerce Monorepo

A modern e-commerce platform built with Next.js, NestJS, and TypeScript in a monorepo structure.

## Project Structure

```
mus/
├── apps/
│   ├── platform/          # Customer-facing e-commerce website (Next.js)
│   ├── dashboard/         # Admin dashboard (Next.js)
│   ├── api/               # Backend API (NestJS)
│   └── blog/              # Blog with Contentful CMS (Next.js)
├── packages/
│   ├── ui/                # Shared UI components
│   ├── types/             # Shared TypeScript types
│   └── config/            # Shared configuration
└── docker-compose.yml     # Docker services configuration
```

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.6** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching and caching
- **Zustand 5** - State management

### Backend
- **NestJS 10** - Node.js framework
- **TypeORM** - ORM for PostgreSQL
- **PostgreSQL** - Database
- **Redis** - Caching
- **MinIO** - S3-compatible object storage
- **Swagger** - API documentation
- **Jest & Supertest** - Testing

### Blog
- **Contentful** - Headless CMS
- **Next.js ISR** - Incremental Static Regeneration

### Tooling
- **pnpm** - Package manager
- **Turborepo** - Build system
- **Docker** - Containerization

## Prerequisites

- Node.js 24+
- pnpm 9+
- Docker & Docker Compose (optional, for running services)

## Getting Started

### Quick Setup (Automated)

Use the automated setup script for the fastest setup:

```bash
./setup-local.sh
```

This script will:
- Check prerequisites (Node.js, pnpm, Docker)
- Install all dependencies
- Create environment files
- Start Docker services (PostgreSQL, Redis & MinIO)
- Create the database
- Setup MinIO buckets for file storage

### Manual Setup

If you prefer manual setup, follow these steps:

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

#### API (.env)
```bash
cd apps/api
cp .env.example .env
# Edit .env with your database credentials
```

#### Platform (.env.local)
```bash
cd apps/platform
cp .env.example .env.local
```

#### Blog (.env.local)
```bash
cd apps/blog
cp .env.example .env.local
# Add your Contentful credentials
```

### 3. Start Services

You have three options for running the project:

#### Option A: Full Docker Setup (All Services) - Recommended for Production-like Environment

Run everything (all apps + database + cache) with Docker Compose:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

This will start:
- PostgreSQL (accessible only within Docker network)
- Redis (accessible only within Docker network)
- API (http://localhost:4000)
- Platform (http://localhost:3000)
- Dashboard (http://localhost:3001)
- Blog (http://localhost:3002)

**Accessing Database & Cache:**
```bash
# PostgreSQL
docker exec -it mus-postgres psql -U postgres -d ecommerce

# Redis
docker exec -it mus-redis redis-cli
```

**Stop all services:**
```bash
docker-compose down

# With volume cleanup (removes database data)
docker-compose down -v
```

#### Option B: Hybrid Setup (Docker for Services, Local for Development) - Recommended for Development

Start only PostgreSQL and Redis with Docker (they won't expose ports to avoid conflicts):
```bash
docker-compose up -d postgres redis
```

Then run apps locally with pnpm for better development experience (hot reload, debugging):
```bash
pnpm dev
```

**Note:** Docker services don't expose ports. The API connects via Docker network. Update `apps/api/.env` to use:
- `DB_HOST=localhost` (or `postgres` if API is also in Docker)
- `REDIS_HOST=localhost` (or `redis` if API is also in Docker)

#### Option C: Full Local Installation

Install and start PostgreSQL and Redis locally on default ports (5432 and 6379).
Update `apps/api/.env` to use `DB_HOST=localhost` and `REDIS_HOST=localhost`.

Then run all apps:
```bash
pnpm dev
```

Or run individual apps:
```bash
# Platform (port 3000)
cd apps/platform && pnpm dev

# Dashboard (port 3001)
cd apps/dashboard && pnpm dev

# API (port 4000)
cd apps/api && pnpm dev

# Blog (port 3002)
cd apps/blog && pnpm dev
```

## Available Scripts

### Setup & Maintenance Scripts

```bash
./setup-local.sh      # Automated setup script
./cleanup.sh          # Cleanup script (Docker, node_modules, builds, etc.)
```

### Development Scripts

```bash
# Development
pnpm dev              # Run all apps in dev mode
pnpm build            # Build all apps
pnpm test             # Run all tests
pnpm lint             # Lint all apps
pnpm format           # Format code with Prettier

# API specific
cd apps/api
pnpm test             # Unit tests
pnpm test:e2e         # E2E tests
pnpm test:cov         # Test coverage
```

## API Documentation

Once the API is running, visit:
- Swagger UI: http://localhost:4000/api/docs

## Database Migrations

TypeORM is configured with `synchronize: true` in development, which automatically syncs your entities with the database. In production, you should use migrations.

## Testing

### Backend Unit Tests
```bash
cd apps/api
pnpm test
```

### Backend E2E Tests
```bash
cd apps/api
pnpm test:e2e
```

## Contentful Setup (Blog)

1. Create a Contentful account at https://www.contentful.com
2. Create a new space
3. Create a content model named "Blog Post" with fields:
   - `title` (Short text)
   - `slug` (Short text, unique)
   - `excerpt` (Long text)
   - `content` (Rich text)
   - `coverImage` (Media)
   - `author` (Short text)
   - `publishDate` (Date & time)
4. Add your Space ID and Access Token to `apps/blog/.env.local`

## Docker Deployment

The project includes Dockerfiles for all applications using multi-stage builds optimized for both development and production.

### Docker Architecture

Each application has its own Dockerfile with the following stages:
- **deps**: Installs dependencies using `npm ci`
- **development**: For local development with hot reload
- **builder**: Builds the application for production
- **production**: Optimized production image with minimal size

### Running with Docker Compose

**Development Mode (all services):**
```bash
# Build and start all services in development mode
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api
```

**Production Mode:**
```bash
# Build production images
docker-compose -f docker-compose.yml build --target production

# Run specific services in production
docker-compose up api platform dashboard blog
```

**Individual Services:**
```bash
# Start only database and cache
docker-compose up -d postgres redis

# Start API only
docker-compose up -d api

# Start frontend apps
docker-compose up -d platform dashboard blog
```

### Docker Commands

**Rebuild specific service:**
```bash
docker-compose build api
docker-compose up -d api
```

**Execute commands in running containers:**
```bash
# Access API container shell
docker exec -it mus-api sh

# Run database migrations
docker exec -it mus-api npm run migration:run

# Access PostgreSQL
docker exec -it mus-postgres psql -U postgres -d ecommerce

# Access Redis CLI
docker exec -it mus-redis redis-cli
```

**Clean up Docker resources:**
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v

# Remove all containers, networks, and images
docker-compose down --rmi all -v
```

## Project Ports

- Platform: http://localhost:3000
- Dashboard: http://localhost:3001
- Blog: http://localhost:3002
- API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs
- PostgreSQL: localhost:5432 (local) or via Docker network (Docker)
- Redis: localhost:6379 (local) or via Docker network (Docker)

**Note:** When using Docker Compose, PostgreSQL and Redis don't expose ports to the host to avoid conflicts with local installations. The API container connects to them via the Docker network.

## Cleanup

To clean up your development environment:

```bash
./cleanup.sh
```

Cleanup options:
1. **Stop Docker services only** - Stops containers but keeps data
2. **Stop and remove volumes** - Removes all database data
3. **Full cleanup** - Removes Docker + node_modules + builds
4. **Complete reset** - Removes everything including environment files
5. **Custom cleanup** - Choose what to clean interactively

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT
