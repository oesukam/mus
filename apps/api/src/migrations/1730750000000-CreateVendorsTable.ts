import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVendorsTable1730750000000 implements MigrationInterface {
  name = 'CreateVendorsTable1730750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendors" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "email" VARCHAR,
        "phone" VARCHAR,
        "address" TEXT,
        "country" VARCHAR,
        "description" TEXT,
        "contactPerson" VARCHAR,
        "taxId" VARCHAR,
        "website" VARCHAR,
        "notes" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vendors_name" ON "vendors"("name")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vendors_email" ON "vendors"("email")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vendors_isActive" ON "vendors"("isActive")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vendors_country" ON "vendors"("country")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendors_country"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendors_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendors_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_vendors_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendors" CASCADE`);
  }
}
