import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateOrdersTable1730660000000 implements MigrationInterface {
  name = "CreateOrdersTable1730660000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create orders table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" BIGSERIAL PRIMARY KEY,
        "orderNumber" VARCHAR NOT NULL UNIQUE,
        "country" VARCHAR NOT NULL,
        "userId" BIGINT NOT NULL,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "deliveryStatus" VARCHAR NOT NULL DEFAULT 'pending',
        "subtotal" DECIMAL(10,2) NOT NULL,
        "vatAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "totalAmount" DECIMAL(10,2) NOT NULL,
        "items" JSONB NOT NULL,
        "paymentStatus" VARCHAR NOT NULL DEFAULT 'pending',
        "paymentMethod" VARCHAR,
        "paidAt" TIMESTAMP,
        "paymentReference" VARCHAR,
        "paymentNotes" TEXT,
        "trackingNumber" VARCHAR,
        "carrier" VARCHAR,
        "estimatedDeliveryDate" TIMESTAMP,
        "actualDeliveryDate" TIMESTAMP,
        "deliveryNotes" TEXT,
        "statusHistory" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_orders_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id")
      )
    `)

    // Add missing columns to existing orders table
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'country') THEN
          ALTER TABLE "orders" ADD COLUMN "country" VARCHAR NOT NULL DEFAULT 'RW';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deliveryStatus') THEN
          ALTER TABLE "orders" ADD COLUMN "deliveryStatus" VARCHAR NOT NULL DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'vatAmount') THEN
          ALTER TABLE "orders" ADD COLUMN "vatAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paymentStatus') THEN
          ALTER TABLE "orders" ADD COLUMN "paymentStatus" VARCHAR NOT NULL DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paymentMethod') THEN
          ALTER TABLE "orders" ADD COLUMN "paymentMethod" VARCHAR;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paidAt') THEN
          ALTER TABLE "orders" ADD COLUMN "paidAt" TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paymentReference') THEN
          ALTER TABLE "orders" ADD COLUMN "paymentReference" VARCHAR;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paymentNotes') THEN
          ALTER TABLE "orders" ADD COLUMN "paymentNotes" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'trackingNumber') THEN
          ALTER TABLE "orders" ADD COLUMN "trackingNumber" VARCHAR;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'carrier') THEN
          ALTER TABLE "orders" ADD COLUMN "carrier" VARCHAR;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'estimatedDeliveryDate') THEN
          ALTER TABLE "orders" ADD COLUMN "estimatedDeliveryDate" TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'actualDeliveryDate') THEN
          ALTER TABLE "orders" ADD COLUMN "actualDeliveryDate" TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'deliveryNotes') THEN
          ALTER TABLE "orders" ADD COLUMN "deliveryNotes" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'statusHistory') THEN
          ALTER TABLE "orders" ADD COLUMN "statusHistory" JSONB;
        END IF;
      END $$;
    `)

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_userId" ON "orders"("userId")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_orderNumber" ON "orders"("orderNumber")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_deliveryStatus" ON "orders"("deliveryStatus")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_orders_paymentStatus" ON "orders"("paymentStatus")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_paymentStatus"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_deliveryStatus"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_orderNumber"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_userId"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "orders" CASCADE`)
  }
}
