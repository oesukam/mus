import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateRolesSystem1730690000000 implements MigrationInterface {
  name = "CreateRolesSystem1730690000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL UNIQUE,
        "displayName" VARCHAR NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `)

    // Create users_roles junction table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users_roles" (
        "userId" BIGINT NOT NULL,
        "roleId" INTEGER NOT NULL,
        PRIMARY KEY ("userId", "roleId"),
        CONSTRAINT "FK_users_roles_user" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_users_roles_role" FOREIGN KEY ("roleId")
          REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `)

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_roles_userId" ON "users_roles"("userId")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_users_roles_roleId" ON "users_roles"("roleId")
    `)

    // Insert default roles
    await queryRunner.query(`
      INSERT INTO "roles" ("name", "displayName", "description")
      VALUES
        ('customer', 'Customer', 'Regular customer with basic access'),
        ('seller', 'Seller', 'Can manage products and view orders'),
        ('admin', 'Administrator', 'Full system access and management')
      ON CONFLICT ("name") DO NOTHING
    `)

    // Migrate existing users to have roles based on their current role column
    await queryRunner.query(`
      INSERT INTO "users_roles" ("userId", "roleId")
      SELECT
        u.id,
        r.id
      FROM "users" u
      CROSS JOIN "roles" r
      WHERE u.role = r.name
      ON CONFLICT DO NOTHING
    `)

    console.log("Roles system created successfully")
    console.log("Default roles: customer, seller, admin")
    console.log("Existing users migrated to new roles system")
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_roles_roleId"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_roles_userId"`)

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "users_roles" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`)

    console.log("Roles system removed")
  }
}
