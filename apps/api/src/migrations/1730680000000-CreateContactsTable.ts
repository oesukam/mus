import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateContactsTable1730680000000 implements MigrationInterface {
  name = "CreateContactsTable1730680000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contacts" (
        "id" BIGSERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "email" VARCHAR NOT NULL,
        "subject" VARCHAR NOT NULL,
        "message" TEXT NOT NULL,
        "userId" BIGINT,
        "status" VARCHAR NOT NULL DEFAULT 'pending',
        "reply" TEXT,
        "repliedAt" TIMESTAMP,
        "repliedBy" BIGINT,
        "emailMessageId" VARCHAR,
        "inReplyTo" VARCHAR,
        "emailThreadId" VARCHAR,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `)

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contacts_email" ON "contacts"("email")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contacts_status" ON "contacts"("status")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contacts_userId" ON "contacts"("userId")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contacts_userId"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contacts_status"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contacts_email"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "contacts" CASCADE`)
  }
}
