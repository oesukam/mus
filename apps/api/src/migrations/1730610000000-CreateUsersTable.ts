import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateUsersTable1730610000000 implements MigrationInterface {
  name = "CreateUsersTable1730610000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" BIGSERIAL PRIMARY KEY,
        "email" VARCHAR NOT NULL UNIQUE,
        "password" VARCHAR,
        "name" VARCHAR NOT NULL,
        "role" VARCHAR NOT NULL DEFAULT 'customer',
        "provider" VARCHAR NOT NULL DEFAULT 'local',
        "googleId" VARCHAR,
        "picture" VARCHAR,
        "status" VARCHAR NOT NULL DEFAULT 'ACTIVE',
        "resetPasswordToken" VARCHAR,
        "resetPasswordExpires" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `)

    // Add missing columns if table already exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'status') THEN
          ALTER TABLE "users" ADD COLUMN "status" VARCHAR NOT NULL DEFAULT 'active';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'resetPasswordToken') THEN
          ALTER TABLE "users" ADD COLUMN "resetPasswordToken" VARCHAR;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'resetPasswordExpires') THEN
          ALTER TABLE "users" ADD COLUMN "resetPasswordExpires" TIMESTAMP;
        END IF;
      END $$;
    `)

    // Create index on email
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users"("email")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`)
  }
}
