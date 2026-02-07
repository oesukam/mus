import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateShippingAddressesTable1730800000000 implements MigrationInterface {
  name = "CreateShippingAddressesTable1730800000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "shipping_addresses" (
        "id" SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL,
        "recipientName" VARCHAR NOT NULL,
        "recipientPhone" VARCHAR,
        "address" TEXT NOT NULL,
        "city" VARCHAR NOT NULL,
        "state" VARCHAR,
        "zipCode" VARCHAR,
        "country" VARCHAR NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_shipping_addresses_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `)

    // Create index on userId for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_shipping_addresses_userId" ON "shipping_addresses" ("userId")
    `)

    // Create index on userId and isDefault for finding default addresses
    await queryRunner.query(`
      CREATE INDEX "idx_shipping_addresses_userId_isDefault"
        ON "shipping_addresses" ("userId", "isDefault")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_shipping_addresses_userId_isDefault"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_shipping_addresses_userId"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "shipping_addresses"`)
  }
}
