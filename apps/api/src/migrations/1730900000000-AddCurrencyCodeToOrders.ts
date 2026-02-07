import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyCodeToOrders1730900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      ADD COLUMN "currencyCode" VARCHAR(10) DEFAULT 'RWF';
    `);
    console.log('✅ Added currencyCode column to orders table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      DROP COLUMN "currencyCode";
    `);
    console.log('✅ Removed currencyCode column from orders table');
  }
}
