import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStockStatusTrigger1730820000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create function that updates stock status based on stock level
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_stock_status()
      RETURNS TRIGGER AS $$
      BEGIN
        -- When stock becomes 0, set status to out_of_stock
        IF NEW."stockQuantity" = 0 AND NEW."stockStatus" != 'out_of_stock' THEN
          NEW."stockStatus" = 'out_of_stock';

        -- When stock is added to out_of_stock product, set to in_stock
        -- (but don't change discontinued status)
        ELSIF NEW."stockQuantity" > 0
          AND OLD."stockStatus" = 'out_of_stock'
          AND NEW."stockStatus" = 'out_of_stock' THEN
          NEW."stockStatus" = 'in_stock';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create trigger that fires BEFORE INSERT OR UPDATE on products table
    await queryRunner.query(`
      CREATE TRIGGER trigger_update_stock_status
      BEFORE INSERT OR UPDATE OF "stockQuantity", "stockStatus"
      ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_stock_status();
    `);

    console.log('✅ Created stock status trigger - stockStatus will auto-update when stockQuantity changes');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger first
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trigger_update_stock_status ON products;
    `);

    // Then drop function
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_stock_status();
    `);

    console.log('✅ Removed stock status trigger');
  }
}
