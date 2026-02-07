import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateCartTables1730810000000 implements MigrationInterface {
  name = "CreateCartTables1730810000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create carts table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "carts" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_carts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_carts_user_id" UNIQUE ("user_id")
      )
    `)

    // Create cart_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cart_items" (
        "id" SERIAL PRIMARY KEY,
        "cart_id" INTEGER NOT NULL,
        "product_id" INTEGER NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_cart_items_cart_id" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cart_items_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_cart_items_cart_product" UNIQUE ("cart_id", "product_id")
      )
    `)

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_carts_user_id" ON "carts" ("user_id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cart_items_cart_id" ON "cart_items" ("cart_id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_cart_items_product_id" ON "cart_items" ("product_id")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cart_items_product_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cart_items_cart_id"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_carts_user_id"`)

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "cart_items"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "carts"`)
  }
}
