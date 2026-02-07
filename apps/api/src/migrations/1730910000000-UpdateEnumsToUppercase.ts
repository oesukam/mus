import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEnumsToUppercase1730910000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update orders table - delivery status
    await queryRunner.query(`
      UPDATE orders
      SET "deliveryStatus" = UPPER("deliveryStatus");
    `);
    console.log('✅ Updated deliveryStatus to UPPERCASE');

    // Update orders table - payment status
    await queryRunner.query(`
      UPDATE orders
      SET "paymentStatus" = UPPER("paymentStatus");
    `);
    console.log('✅ Updated paymentStatus to UPPERCASE');

    // Update orders table - payment method
    await queryRunner.query(`
      UPDATE orders
      SET "paymentMethod" = UPPER("paymentMethod")
      WHERE "paymentMethod" IS NOT NULL;
    `);
    console.log('✅ Updated paymentMethod to UPPERCASE');

    // Update orders table - old status field (deprecated but still exists)
    await queryRunner.query(`
      UPDATE orders
      SET "status" = UPPER("status");
    `);
    console.log('✅ Updated status to UPPERCASE');

    // Update products table - stock status
    await queryRunner.query(`
      UPDATE products
      SET "stockStatus" = UPPER("stockStatus");
    `);
    console.log('✅ Updated stockStatus to UPPERCASE');

    // Update users table - status
    await queryRunner.query(`
      UPDATE users
      SET "status" = UPPER("status");
    `);
    console.log('✅ Updated user status to UPPERCASE');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert orders table - delivery status
    await queryRunner.query(`
      UPDATE orders
      SET "deliveryStatus" = LOWER("deliveryStatus");
    `);

    // Revert orders table - payment status
    await queryRunner.query(`
      UPDATE orders
      SET "paymentStatus" = LOWER("paymentStatus");
    `);

    // Revert orders table - payment method
    await queryRunner.query(`
      UPDATE orders
      SET "paymentMethod" = LOWER("paymentMethod")
      WHERE "paymentMethod" IS NOT NULL;
    `);

    // Revert orders table - old status field
    await queryRunner.query(`
      UPDATE orders
      SET "status" = LOWER("status");
    `);

    // Revert products table - stock status
    await queryRunner.query(`
      UPDATE products
      SET "stockStatus" = LOWER("stockStatus");
    `);

    // Revert users table - status
    await queryRunner.query(`
      UPDATE users
      SET "status" = LOWER("status");
    `);

    console.log('✅ Reverted all enums to lowercase');
  }
}
