import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSearchIndex1730635000000 implements MigrationInterface {
  name = 'AddProductSearchIndex1730635000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration runs AFTER CreateProductsTable (1730630000000)
    // Adds full-text search capability to products table

    // Check if products table exists
    const tableExists = await queryRunner.hasTable('products');
    if (!tableExists) {
      console.log('Products table does not exist yet, skipping search index migration');
      return;
    }

    // Add type column if it doesn't exist
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'type'
        ) THEN
          ALTER TABLE "products" ADD COLUMN "type" character varying;
        END IF;
      END $$;
    `);

    // Add searchVector column (not generated)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'searchVector'
        ) THEN
          ALTER TABLE "products" ADD COLUMN "searchVector" tsvector;
        END IF;
      END $$;
    `);

    // Create or replace function to update search vector
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
      BEGIN
        NEW."searchVector" := to_tsvector('english',
          coalesce(NEW.name, '') || ' ' ||
          coalesce(NEW.description, '') || ' ' ||
          coalesce(NEW.category, '') || ' ' ||
          coalesce(NEW.type, '')
        );
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql IMMUTABLE;
    `);

    // Create trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS products_search_vector_trigger ON "products";
      CREATE TRIGGER products_search_vector_trigger
      BEFORE INSERT OR UPDATE ON "products"
      FOR EACH ROW
      EXECUTE FUNCTION products_search_vector_update();
    `);

    // Update existing rows
    await queryRunner.query(`
      UPDATE "products"
      SET "searchVector" = to_tsvector('english',
        coalesce(name, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(category, '') || ' ' ||
        coalesce(type, '')
      );
    `);

    // Create GIN index for fast full-text search
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PRODUCT_SEARCH"
      ON "products" USING GIN ("searchVector");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PRODUCT_SEARCH"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS products_search_vector_trigger ON "products"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS products_search_vector_update()`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'searchVector') THEN
          ALTER TABLE "products" DROP COLUMN "searchVector";
        END IF;
      END $$;
    `);
  }
}
