import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailMessageIdToOrders1730840000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add emailMessageId column to orders table
    await queryRunner.query(`
      ALTER TABLE orders
      ADD COLUMN "emailMessageId" VARCHAR(255);
    `);

    console.log('✅ Added emailMessageId column to orders table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove emailMessageId column from orders table
    await queryRunner.query(`
      ALTER TABLE orders
      DROP COLUMN "emailMessageId";
    `);

    console.log('✅ Removed emailMessageId column from orders table');
  }
}
