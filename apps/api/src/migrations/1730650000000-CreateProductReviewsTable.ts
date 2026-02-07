import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateProductReviewsTable1730650000000 implements MigrationInterface {
  name = "CreateProductReviewsTable1730650000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products_reviews" (
        "id" SERIAL PRIMARY KEY,
        "productId" INTEGER NOT NULL,
        "userId" BIGINT NOT NULL,
        "rating" INTEGER NOT NULL,
        "title" VARCHAR NOT NULL,
        "content" TEXT NOT NULL,
        "wouldRecommend" BOOLEAN NOT NULL DEFAULT true,
        "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
        "helpfulCount" INTEGER NOT NULL DEFAULT 0,
        "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "adminNote" VARCHAR,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_products_reviews_product" FOREIGN KEY ("productId")
          REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_products_reviews_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `)

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_reviews_productId" ON "products_reviews"("productId")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_reviews_userId" ON "products_reviews"("userId")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_products_reviews_status" ON "products_reviews"("status")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_reviews_status"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_reviews_userId"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_reviews_productId"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "products_reviews" CASCADE`)
  }
}
