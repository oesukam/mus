# Architecture Overview

## Monorepo Structure

This project uses a monorepo architecture managed by **pnpm workspaces** and **Turborepo**, allowing code sharing and efficient builds across multiple applications.

```
mus/
├── apps/               # Application packages
├── packages/           # Shared packages
└── docker-compose.yml  # Service orchestration
```

## Applications

### 1. Platform (`apps/platform`)

**Customer-facing e-commerce website**

- **Framework:** Next.js 15 (App Router)
- **React:** 19.0
- **Port:** 3000
- **Purpose:** Product browsing, shopping cart, checkout
- **Key Features:**
  - Server-side rendering (SSR)
  - Product catalog
  - User authentication
  - Shopping cart
  - Order management

### 2. Dashboard (`apps/dashboard`)

**Admin control panel**

- **Framework:** Next.js 15 (App Router)
- **React:** 19.0
- **Port:** 3001
- **Purpose:** Business operations and analytics
- **Key Features:**
  - Product management
  - Order processing
  - User management
  - Analytics dashboard (Recharts 2.13)
  - Sales reports

### 3. API (`apps/api`)

**Backend REST API**

- **Framework:** NestJS 10.4
- **Port:** 4000
- **Database:** PostgreSQL (TypeORM 0.3.20)
- **Cache:** In-memory (cache-manager 5.7)
- **Documentation:** Swagger/OpenAPI 8.0
- **Testing:** Jest 29 + Supertest 7

**Architecture Pattern:**

```
src/
├── modules/
│   ├── products/
│   │   ├── entities/      # TypeORM entities
│   │   ├── dto/           # Data transfer objects
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   ├── users/
│   └── orders/
├── common/                # Shared utilities
├── app.module.ts          # Root module
└── main.ts                # Bootstrap
```

**Key Features:**

- RESTful API design
- Input validation (class-validator)
- Database ORM (TypeORM)
- Redis caching
- Swagger documentation
- Comprehensive testing

## Shared Packages

### 1. `@mus/types`

**Shared TypeScript types**

```typescript
export interface Product {
  id: number
  name: string
  price: number
  // ...
}
```

Used by both frontend and backend for type safety.

### 2. `@mus/ui`

**Shared UI components**

Reusable React components used across frontend apps:

- Button
- Card
- Form elements
- Layouts

### 3. `@mus/config`

**Shared configuration**

Environment variables and shared constants.

## Data Flow

```
┌─────────────┐
│   Platform  │
│  (Next.js)  │
└──────┬──────┘
       │
       │ HTTP/REST
       ↓
┌──────────────┐      ┌──────────────┐
│  Dashboard   │──────→│     API      │
│  (Next.js)   │      │  (NestJS)    │
└──────────────┘      └───────┬──────┘
                              │
                    ┌─────────┼─────────┐
                    │                   │
                    ↓                   ↓
              ┌──────────┐        ┌─────────┐
              │PostgreSQL│        │  Redis  │
              │ Database │        │  Cache  │
              └──────────┘        └─────────┘

┌─────────────┐
│    Blog     │
│  (Next.js)  │
└──────┬──────┘
       │
       │ API
       ↓
┌──────────────┐
│  Contentful  │
│     CMS      │
└──────────────┘
```

## Backend Architecture

### Modules

Each module follows NestJS best practices:

1. **Controller Layer**
   - HTTP request handling
   - Route definitions
   - Request validation
   - Response formatting

2. **Service Layer**
   - Business logic
   - Data manipulation
   - Cache management
   - Error handling

3. **Repository Layer (TypeORM)**
   - Database operations
   - Query building
   - Transactions

### Caching Strategy

Redis is used for caching:

- Product listings (TTL: 10 minutes)
- Individual products (TTL: 10 minutes)
- Cache invalidation on updates

### Testing Strategy

1. **Unit Tests** (`*.spec.ts`)
   - Service logic testing
   - Mocked dependencies
   - High coverage requirement

2. **E2E Tests** (`*.e2e-spec.ts`)
   - Full request/response cycle
   - Real database integration
   - API contract validation

## Frontend Architecture

### Next.js App Router

All frontend apps use Next.js 14 App Router:

```
app/
├── layout.tsx       # Root layout
├── page.tsx         # Home page
├── products/
│   ├── page.tsx     # Products list
│   └── [id]/
│       └── page.tsx # Product detail
└── api/             # API routes (if needed)
```

### State Management

- **Global State:** Zustand
- **Server State:** React Query
- **Form State:** React Hook Form (when needed)

### Styling

- **CSS Framework:** Tailwind CSS
- **Component Library:** Custom (`@mus/ui`)
- **Theme:** Shared across apps
