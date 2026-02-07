import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateProductsTable1730630000000 implements MigrationInterface {
  name = "CreateProductsTable1730630000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "slug" VARCHAR UNIQUE NOT NULL,
        "summary" VARCHAR(255) NULL,
        "description" TEXT NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "vatPercentage" FLOAT NOT NULL DEFAULT 0,
        "currency" VARCHAR NOT NULL DEFAULT 'RWF',
        "country" VARCHAR NOT NULL,
        "stockQuantity" INTEGER NOT NULL DEFAULT 0,
        "category" VARCHAR NOT NULL,
        "type" VARCHAR,
        "coverImageId" BIGINT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isFeatured" BOOLEAN NOT NULL DEFAULT false,
        "stockStatus" VARCHAR NOT NULL DEFAULT 'IN_STOCK',
        "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_products_coverImageId" FOREIGN KEY ("coverImageId") REFERENCES "files"("id") ON DELETE SET NULL
      )
    `)

    // -- Add missing columns to existing products table
    await queryRunner.query(`
      DO $$
      BEGIN
        -- Add slug column with unique constraint
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
          -- First, add the column as nullable
          ALTER TABLE "products" ADD COLUMN "slug" VARCHAR;

          -- Generate slugs for existing products (from name, converted to lowercase and replacing spaces with dashes)
          UPDATE "products" SET "slug" = LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g')) WHERE "slug" IS NULL;

          -- Make it NOT NULL and add unique constraint
          ALTER TABLE "products" ALTER COLUMN "slug" SET NOT NULL;
          ALTER TABLE "products" ADD CONSTRAINT "UQ_products_slug" UNIQUE ("slug");
        END IF;

        -- Add vatPercentage
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'vatPercentage') THEN
          ALTER TABLE "products" ADD COLUMN "vatPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0;
        END IF;

        -- Add currency with default value
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'currency') THEN
          ALTER TABLE "products" ADD COLUMN "currency" VARCHAR NOT NULL DEFAULT 'USD';
        END IF;

        -- Add country with default value
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'country') THEN
          ALTER TABLE "products" ADD COLUMN "country" VARCHAR NOT NULL DEFAULT 'RW';
        END IF;

        -- Add type
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'type') THEN
          ALTER TABLE "products" ADD COLUMN "type" VARCHAR;
        END IF;

        -- Add stockStatus
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stockStatus') THEN
          ALTER TABLE "products" ADD COLUMN "stockStatus" VARCHAR NOT NULL DEFAULT 'in_stock';
        END IF;

        -- Add discountPercentage
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'discountPercentage') THEN
          ALTER TABLE "products" ADD COLUMN "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0;
        END IF;

        -- Add coverImageId with foreign key to files table
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'coverImageId') THEN
          ALTER TABLE "products" ADD COLUMN "coverImageId" INTEGER;
          ALTER TABLE "products" ADD CONSTRAINT "FK_products_coverImageId" FOREIGN KEY ("coverImageId") REFERENCES "files"("id") ON DELETE SET NULL;
        END IF;

        -- Drop old imageUrl column if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imageUrl') THEN
          ALTER TABLE "products" DROP COLUMN "imageUrl";
        END IF;

        -- Drop old images JSONB column if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'images') THEN
          ALTER TABLE "products" DROP COLUMN "images";
        END IF;

        -- Drop old imagesJson JSONB column if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'imagesJson') THEN
          ALTER TABLE "products" DROP COLUMN "imagesJson";
        END IF;
      END $$;
    `)

    // searchVector will be added in a separate migration

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_slug" ON "products"("slug")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_category" ON "products"("category")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_country" ON "products"("country")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_country"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_category"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_slug"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "products" CASCADE`)
  }
}
