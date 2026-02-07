import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateFilesTable1730620000000 implements MigrationInterface {
  name = "CreateFilesTable1730620000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "files" (
        "id" BIGSERIAL PRIMARY KEY,
        "key" VARCHAR NOT NULL UNIQUE,
        "url" VARCHAR NOT NULL,
        "title" VARCHAR NULL,
        "description" TEXT NULL,
        "urlThumbnail" VARCHAR NULL,
        "urlMedium" VARCHAR NULL,
        "urlLarge" VARCHAR NULL,
        "originalName" VARCHAR NOT NULL,
        "mimeType" VARCHAR NOT NULL,
        "size" INTEGER NOT NULL,
        "folder" VARCHAR NOT NULL,
        "uploadedBy" INTEGER,
        "entityType" VARCHAR,
        "entityId" INTEGER,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `)

    // Create index on key
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_files_key" ON "files"("key")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_key"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "files" CASCADE`)
  }
}
