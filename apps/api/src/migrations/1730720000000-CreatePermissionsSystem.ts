import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm"

export class CreatePermissionsSystem1730720000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: "permissions",
        columns: [
          {
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "name",
            type: "varchar",
            length: "100",
            isUnique: true,
          },
          {
            name: "resource",
            type: "varchar",
            length: "50",
          },
          {
            name: "action",
            type: "varchar",
            length: "50",
          },
          {
            name: "displayName",
            type: "varchar",
            length: "100",
          },
          {
            name: "description",
            type: "text",
            isNullable: true,
          },
          {
            name: "createdAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    )

    // Create roles_permissions join table
    await queryRunner.createTable(
      new Table({
        name: "roles_permissions",
        columns: [
          {
            name: "roleId",
            type: "int",
          },
          {
            name: "permissionId",
            type: "int",
          },
        ],
      }),
      true,
    )

    // Add foreign key for roleId
    await queryRunner.createForeignKey(
      "roles_permissions",
      new TableForeignKey({
        columnNames: ["roleId"],
        referencedColumnNames: ["id"],
        referencedTableName: "roles",
        onDelete: "CASCADE",
      }),
    )

    // Add foreign key for permissionId
    await queryRunner.createForeignKey(
      "roles_permissions",
      new TableForeignKey({
        columnNames: ["permissionId"],
        referencedColumnNames: ["id"],
        referencedTableName: "permissions",
        onDelete: "CASCADE",
      }),
    )

    // Seed default permissions
    await queryRunner.query(`
      INSERT INTO permissions (name, resource, action, "displayName", description) VALUES
      -- User permissions
      ('users:read', 'users', 'read', 'View Users', 'View user information'),
      ('users:write', 'users', 'write', 'Manage Users', 'Create and update users'),
      ('users:delete', 'users', 'delete', 'Delete Users', 'Delete users'),

      -- Product permissions
      ('products:read', 'products', 'read', 'View Products', 'View product information'),
      ('products:write', 'products', 'write', 'Manage Products', 'Create and update products'),
      ('products:delete', 'products', 'delete', 'Delete Products', 'Delete products'),

      -- Order permissions
      ('orders:read', 'orders', 'read', 'View Orders', 'View order information'),
      ('orders:write', 'orders', 'write', 'Manage Orders', 'Create and update orders'),
      ('orders:delete', 'orders', 'delete', 'Delete Orders', 'Delete orders'),

      -- Role permissions
      ('roles:read', 'roles', 'read', 'View Roles', 'View role information'),
      ('roles:write', 'roles', 'write', 'Manage Roles', 'Create and update roles'),
      ('roles:delete', 'roles', 'delete', 'Delete Roles', 'Delete roles'),

      -- Permission permissions
      ('permissions:read', 'permissions', 'read', 'View Permissions', 'View permission information'),
      ('permissions:write', 'permissions', 'write', 'Manage Permissions', 'Create and update permissions'),
      ('permissions:delete', 'permissions', 'delete', 'Delete Permissions', 'Delete permissions'),

      -- Feature flag permissions
      ('features-flags:read', 'features-flags', 'read', 'View Feature Flags', 'View feature flag information'),
      ('features-flags:write', 'features-flags', 'write', 'Manage Feature Flags', 'Create and update feature flags'),
      ('features-flags:delete', 'features-flags', 'delete', 'Delete Feature Flags', 'Delete feature flags');
    `)

    // Assign all permissions to admin role
    await queryRunner.query(`
      INSERT INTO roles_permissions ("roleId", "permissionId")
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'admin';
    `)

    // Assign product and order permissions to seller role
    await queryRunner.query(`
      INSERT INTO roles_permissions ("roleId", "permissionId")
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'seller'
      AND p.resource IN ('products', 'orders');
    `)

    // Assign read-only order permissions to customer role
    await queryRunner.query(`
      INSERT INTO roles_permissions ("roleId", "permissionId")
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'customer'
      AND p.name = 'orders:read';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const rolesPermissionsTable = await queryRunner.getTable("roles_permissions")
    const foreignKeys = rolesPermissionsTable.foreignKeys
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey("roles_permissions", foreignKey)
    }

    // Drop tables
    await queryRunner.dropTable("roles_permissions")
    await queryRunner.dropTable("permissions")
  }
}
