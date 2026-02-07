import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateTransactionsTable1730670000000 implements MigrationInterface {
  name = "CreateTransactionsTable1730670000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" SERIAL PRIMARY KEY,
        "transactionNumber" VARCHAR NOT NULL UNIQUE,
        "type" VARCHAR NOT NULL,
        "orderId" BIGINT,
        "userId" BIGINT,
        "customerName" VARCHAR,
        "customerEmail" VARCHAR,
        "customerPhone" VARCHAR,
        "country" VARCHAR NOT NULL,
        "items" JSONB,
        "expenseCategory" VARCHAR,
        "description" TEXT NOT NULL,
        "transactionDate" DATE NOT NULL,
        "subtotal" DECIMAL(10,2),
        "vatAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "amount" DECIMAL(10,2) NOT NULL,
        "currency" VARCHAR NOT NULL DEFAULT 'USD',
        "paymentMethod" VARCHAR,
        "paymentReference" VARCHAR,
        "vendor" VARCHAR,
        "invoiceNumber" VARCHAR,
        "receiptUrl" VARCHAR,
        "notes" TEXT,
        "recordedBy" BIGINT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_transactions_order" FOREIGN KEY ("orderId")
          REFERENCES "orders"("id"),
        CONSTRAINT "FK_transactions_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id"),
        CONSTRAINT "FK_transactions_recorded_by" FOREIGN KEY ("recordedBy")
          REFERENCES "users"("id")
      )
    `)

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_type" ON "transactions"("type")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_country" ON "transactions"("country")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_orderId" ON "transactions"("orderId")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_userId" ON "transactions"("userId")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_transactions_transactionDate" ON "transactions"("transactionDate")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_transactionDate"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_userId"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_orderId"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_country"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_type"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions" CASCADE`)
  }
}
