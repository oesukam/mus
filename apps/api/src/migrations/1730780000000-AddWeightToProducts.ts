import { MigrationInterface, QueryRunner } from "typeorm"

export class AddWeightToProducts1730780000000 implements MigrationInterface {
  name = "AddWeightToProducts1730780000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        -- Add weightInKg column with default value of 0
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weightInKg') THEN
          ALTER TABLE "products" ADD COLUMN "weightInKg" DECIMAL(10,3) NOT NULL DEFAULT 0;
        END IF;
      END $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products" DROP COLUMN IF EXISTS "weightInKg"
    `)
  }
}
