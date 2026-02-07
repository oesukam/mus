import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMobilePaymentsTable1730850000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE mobile_payments (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "providerName" VARCHAR(100) NOT NULL,
        "phoneNumber" VARCHAR(50) NOT NULL,
        label VARCHAR(100),
        "isDefault" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    // Create index on userId for faster lookups
    await queryRunner.query(`
      CREATE INDEX idx_mobile_payments_user_id ON mobile_payments("userId");
    `);

    console.log('✅ Created mobile_payments table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_mobile_payments_user_id;`);
    await queryRunner.query(`DROP TABLE IF EXISTS mobile_payments;`);
    console.log('✅ Dropped mobile_payments table');
  }
}
