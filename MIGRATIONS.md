# Database Migrations Guide

This document explains the database migration system for the MUS e-commerce API.

## Overview

The project uses TypeORM migrations instead of `synchronize: true` to manage database schema changes. This provides better control, version tracking, and production safety.

## Migration System Setup

### Configuration Files

1. **Data Source** (`apps/api/src/database/data-source.ts`):
   - Configures TypeORM for CLI migrations
   - Loads environment variables
   - Points to migration files
   - Used by migration scripts

2. **App Module** (`apps/api/src/app.module.ts`):
   - Disabled `synchronize`
   - Enabled `migrationsRun: true` (auto-run migrations on startup)
   - Points to migration files

### Available Scripts

In `apps/api/package.json`:

```bash
# Generate a new migration from entity changes
pnpm migration:generate src/migrations/MigrationName

# Create an empty migration file
pnpm migration:create src/migrations/MigrationName

# Run pending migrations
pnpm migration:run

# Revert the last migration
pnpm migration:revert

# Show migration status
pnpm migration:show
```

## Current Migration Files

All migrations are in `apps/api/src/migrations/` (in execution order):

1. **1730610000000-CreateUsersTable.ts**: Users table with authentication
2. **1730620000000-CreateFilesTable.ts**: File storage system
3. **1730630000000-CreateProductsTable.ts**: Products catalog with VAT
4. **1730635000000-AddProductSearchIndex.ts**: Full-text search for products
5. **1730640000000-CreateProductImagesTable.ts**: Product images
6. **1730650000000-CreateProductReviewsTable.ts**: Product reviews and ratings
7. **1730660000000-CreateOrdersTable.ts**: Orders with delivery tracking
8. **1730670000000-CreateTransactionsTable.ts**: Financial transactions
9. **1730680000000-CreateContactsTable.ts**: Contact form submissions
10. **1730690000000-CreateRolesSystem.ts**: Multi-role system for users

## Database Schema Design

### Enum Handling Strategy

**IMPORTANT**: We use VARCHAR instead of PostgreSQL ENUM types for all status/category fields.

**Reasons**:
- Easier to update enum values without database migrations
- No need to run `ALTER TYPE` statements in production
- Enum constraints are enforced at application level by TypeORM
- More flexible for multi-region deployments

**Example**:
```typescript
// Entity definition (TypeScript enum)
@Column({ type: 'varchar', default: 'active' })
status: UserStatus;

// Migration (VARCHAR column)
"status" VARCHAR NOT NULL DEFAULT 'active'
```

### Table Relationships

```
users
  ├─→ orders (userId)
  ├─→ product_reviews (userId)
  ├─→ transactions (userId, recordedBy)
  └─→ files (uploadedBy)

products
  ├─→ product_images (productId) [CASCADE DELETE]
  ├─→ product_reviews (productId) [CASCADE DELETE]
  └─→ order items (JSONB reference)

orders
  ├─→ users (userId)
  └─→ transactions (orderId)

files
  └─→ product_images (fileId) [CASCADE DELETE]
```

## Migration Patterns

### 1. Create Table with Backward Compatibility

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Create table if doesn't exist
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "table_name" (
      "id" SERIAL PRIMARY KEY,
      "column" VARCHAR NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT now()
    )
  `);

  // Add missing columns to existing tables
  await queryRunner.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'table_name' AND column_name = 'new_column'
      ) THEN
        ALTER TABLE "table_name" ADD COLUMN "new_column" VARCHAR;
      END IF;
    END $$;
  `);
}
```

### 2. Add Index Safely

```typescript
await queryRunner.query(`
  CREATE INDEX IF NOT EXISTS "IDX_table_column"
  ON "table_name"("column")
`);
```

### 3. Full-Text Search (tsvector)

```typescript
// Add tsvector column
await queryRunner.query(`
  ALTER TABLE "products" ADD COLUMN "searchVector" tsvector
`);

// Create trigger function
await queryRunner.query(`
  CREATE OR REPLACE FUNCTION products_search_vector_update()
  RETURNS trigger AS $$
  BEGIN
    NEW."searchVector" := to_tsvector('english',
      coalesce(NEW.name, '') || ' ' ||
      coalesce(NEW.description, '')
    );
    RETURN NEW;
  END
  $$ LANGUAGE plpgsql IMMUTABLE;
`);

// Create trigger
await queryRunner.query(`
  CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "products"
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();
`);

// Create GIN index
await queryRunner.query(`
  CREATE INDEX "IDX_PRODUCT_SEARCH"
  ON "products" USING GIN ("searchVector")
`);
```

## Running Migrations

### Development

Migrations run automatically on app startup (via `migrationsRun: true`).

To run manually:
```bash
docker exec mus-api pnpm migration:run
```

### Production

1. **Before deployment**: Test migrations on staging database
2. **During deployment**:
   - Migrations run automatically on app startup
   - OR run manually before starting app:
     ```bash
     pnpm migration:run
     ```
3. **Rollback if needed**:
   ```bash
   pnpm migration:revert
   ```

## Creating New Migrations

### Method 1: Auto-generate from Entity Changes

1. Modify your entity files
2. Generate migration:
   ```bash
   pnpm migration:generate src/migrations/DescriptiveName
   ```
3. Review and test the generated migration
4. Commit to version control

### Method 2: Create Empty Migration

1. Create empty migration:
   ```bash
   pnpm migration:create src/migrations/AddFeatureName
   ```
2. Write `up()` and `down()` methods manually
3. Test thoroughly
4. Commit to version control

## Best Practices

1. **Never modify executed migrations**: Create a new migration instead
2. **Always provide `down()` methods**: Enable rollback capability
3. **Test migrations**: Run on development database first
4. **Use transactions**: Migrations should be atomic
5. **Backwards compatibility**: Handle both new and existing databases
6. **Avoid ENUMs**: Use VARCHAR for status/category fields
7. **Index strategy**: Add indexes for foreign keys and frequently queried columns
8. **JSONB for flexible data**: Use for order items, status history, etc.

## Troubleshooting

### Migration Failed

```bash
# Check migration status
pnpm migration:show

# Check database logs
docker logs mus-postgres

# Revert last migration
pnpm migration:revert

# Or connect to database and manually fix
docker exec -it mus-postgres psql -U postgres -d ecommerce
```

### Reset Database (Development Only)

```bash
# Stop containers
docker-compose down

# Remove volumes
docker volume rm mus_postgres_data

# Restart (migrations will run on fresh database)
docker-compose up --build
```

### Check Migration History

```sql
-- Connect to database
docker exec -it mus-postgres psql -U postgres -d ecommerce

-- View migration history
SELECT * FROM migrations ORDER BY timestamp;
```

## Column Naming Conventions

- Use camelCase in TypeORM entities
- PostgreSQL columns created as "camelCase" (quoted identifiers)
- JSON fields use camelCase for consistency
- Examples: `orderNumber`, `createdAt`, `userId`

## Future Improvements

1. **Seeding Strategy**: Separate seeders for test data
2. **Migration Testing**: Automated tests for migrations
3. **Data Migrations**: Guidelines for data transformation migrations
4. **Multi-tenancy**: Migration strategy for multiple databases
5. **Zero-downtime**: Blue-green deployment migration strategy

## Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/sql-altertable.html)
- Project Architecture: See `ARCHITECTURE.md`
