import { MigrationInterface, QueryRunner } from "typeorm"

export class SeedAdminUser1730740000000 implements MigrationInterface {
  name = "SeedAdminUser1730740000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get admin user details from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || "oesukam@gmail.com"
    const adminName = process.env.ADMIN_NAME || "Admin User"
    const adminProvider = process.env.ADMIN_PROVIDER || "google"

    // Insert admin user if not exists
    await queryRunner.query(
      `
      INSERT INTO "users" ("email", "name", "provider", "status")
      VALUES ($1, $2, $3, 'ACTIVE')
      ON CONFLICT ("email") DO NOTHING
    `,
      [adminEmail, adminName, adminProvider],
    )

    // Get the admin role ID
    const adminRoleResult = await queryRunner.query(`
      SELECT id FROM "roles" WHERE name = 'admin' LIMIT 1
    `)

    if (adminRoleResult.length === 0) {
      throw new Error("Admin role not found. Please ensure CreateRolesSystem migration has run.")
    }

    const adminRoleId = adminRoleResult[0].id

    // Assign admin role to the user
    await queryRunner.query(
      `
      INSERT INTO "users_roles" ("userId", "roleId")
      SELECT u.id, $1
      FROM "users" u
      WHERE u.email = $2
      ON CONFLICT DO NOTHING
    `,
      [adminRoleId, adminEmail],
    )

    console.log(`✅ Admin user seeded successfully: ${adminEmail}`)
    console.log(`   - Name: ${adminName}`)
    console.log(`   - Provider: ${adminProvider}`)
    console.log("   - Role: Admin (with all permissions)")
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove admin role assignment
    await queryRunner.query(`
      DELETE FROM "users_roles"
      WHERE "userId" IN (
        SELECT id FROM "users" WHERE email = 'oesukam@gmail.com'
      )
    `)

    // Remove the user
    await queryRunner.query(`
      DELETE FROM "users" WHERE email = 'oesukam@gmail.com'
    `)

    console.log("⚠️  Admin user removed: oesukam@gmail.com")
  }
}
