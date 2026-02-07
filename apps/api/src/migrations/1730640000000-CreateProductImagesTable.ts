import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateProductImagesTable1730640000000 implements MigrationInterface {
  name = "CreateProductImagesTable1730640000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products_images" (
        "id" SERIAL PRIMARY KEY,
        "productId" INTEGER NOT NULL,
        "fileId" INTEGER NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "isPrimary" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_products_images_product" FOREIGN KEY ("productId")
          REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_products_images_file" FOREIGN KEY ("fileId")
          REFERENCES "files"("id") ON DELETE CASCADE
      )
    `)

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_images_productId" ON "products_images"("productId")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_images_fileId" ON "products_images"("fileId")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_images_fileId"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_images_productId"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "products_images" CASCADE`)
  }
}
