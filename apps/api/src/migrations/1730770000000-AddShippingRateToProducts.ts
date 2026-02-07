import { MigrationInterface, QueryRunner } from "typeorm"

export class AddShippingRateToProducts1730770000000 implements MigrationInterface {
  name = "AddShippingRateToProducts1730770000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        -- Add shippingRatePerKm column with default value of 0
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'shippingRatePerKm') THEN
          ALTER TABLE "products" ADD COLUMN "shippingRatePerKm" DECIMAL(10,2) NOT NULL DEFAULT 0;
        END IF;
      END $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "shippingRatePerKm"
    `)
  }
}
