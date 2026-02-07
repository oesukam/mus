import { MigrationInterface, QueryRunner } from "typeorm"

export class AddRecipientInfoToOrders1730790000000 implements MigrationInterface {
  name = "AddRecipientInfoToOrders1730790000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        -- Make userId nullable for guest checkouts
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'userId' AND is_nullable = 'NO') THEN
          ALTER TABLE "orders" ALTER COLUMN "userId" DROP NOT NULL;
        END IF;

        -- Add recipient name
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'recipientName') THEN
          ALTER TABLE "orders" ADD COLUMN "recipientName" VARCHAR;
        END IF;

        -- Add recipient email
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'recipientEmail') THEN
          ALTER TABLE "orders" ADD COLUMN "recipientEmail" VARCHAR NOT NULL DEFAULT '';
          -- Update default to allow existing orders without email
          ALTER TABLE "orders" ALTER COLUMN "recipientEmail" DROP DEFAULT;
        END IF;

        -- Add recipient phone
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'recipientPhone') THEN
          ALTER TABLE "orders" ADD COLUMN "recipientPhone" VARCHAR;
        END IF;

        -- Add shipping address
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingAddress') THEN
          ALTER TABLE "orders" ADD COLUMN "shippingAddress" TEXT NOT NULL DEFAULT '';
          ALTER TABLE "orders" ALTER COLUMN "shippingAddress" DROP DEFAULT;
        END IF;

        -- Add shipping city
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingCity') THEN
          ALTER TABLE "orders" ADD COLUMN "shippingCity" VARCHAR NOT NULL DEFAULT '';
          ALTER TABLE "orders" ALTER COLUMN "shippingCity" DROP DEFAULT;
        END IF;

        -- Add shipping state
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingState') THEN
          ALTER TABLE "orders" ADD COLUMN "shippingState" VARCHAR;
        END IF;

        -- Add shipping ZIP code
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingZipCode') THEN
          ALTER TABLE "orders" ADD COLUMN "shippingZipCode" VARCHAR;
        END IF;

        -- Add shipping country
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shippingCountry') THEN
          ALTER TABLE "orders" ADD COLUMN "shippingCountry" VARCHAR NOT NULL DEFAULT '';
          ALTER TABLE "orders" ALTER COLUMN "shippingCountry" DROP DEFAULT;
        END IF;
      END $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingCountry";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingZipCode";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingState";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingCity";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingAddress";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "recipientPhone";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "recipientEmail";
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "recipientName";
      ALTER TABLE "orders" ALTER COLUMN "userId" SET NOT NULL;
    `)
  }
}
