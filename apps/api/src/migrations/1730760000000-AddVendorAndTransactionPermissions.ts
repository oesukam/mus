import { MigrationInterface, QueryRunner } from "typeorm"

export class AddVendorAndTransactionPermissions1730760000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add vendor and transaction permissions
    await queryRunner.query(`
      INSERT INTO permissions (name, resource, action, "displayName", description) VALUES
      -- Vendor permissions
      ('vendors:read', 'vendors', 'read', 'View Vendors', 'View vendor information'),
      ('vendors:write', 'vendors', 'write', 'Manage Vendors', 'Create and update vendors'),
      ('vendors:delete', 'vendors', 'delete', 'Delete Vendors', 'Delete vendors'),

      -- Transaction permissions
      ('transactions:read', 'transactions', 'read', 'View Transactions', 'View transaction information'),
      ('transactions:write', 'transactions', 'write', 'Manage Transactions', 'Create and update transactions'),
      ('transactions:delete', 'transactions', 'delete', 'Delete Transactions', 'Delete transactions'),

      -- Files permissions
      ('files:read', 'files', 'read', 'View Files', 'View file information'),
      ('files:write', 'files', 'write', 'Manage Files', 'Upload and update files'),
      ('files:delete', 'files', 'delete', 'Delete Files', 'Delete files');
    `)

    // Assign all new permissions to admin role
    await queryRunner.query(`
      INSERT INTO roles_permissions ("roleId", "permissionId")
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'admin'
      AND p.resource IN ('vendors', 'transactions', 'files')
      AND NOT EXISTS (
        SELECT 1 FROM roles_permissions rp
        WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
      );
    `)

    // Assign transaction read/write and files permissions to seller role
    await queryRunner.query(`
      INSERT INTO roles_permissions ("roleId", "permissionId")
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'seller'
      AND (
        (p.resource = 'transactions' AND p.action IN ('read', 'write'))
        OR (p.resource = 'files' AND p.action IN ('read', 'write'))
      )
      AND NOT EXISTS (
        SELECT 1 FROM roles_permissions rp
        WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
      );
    `)

    // Assign read-only transaction permissions to customer role
    await queryRunner.query(`
      INSERT INTO roles_permissions ("roleId", "permissionId")
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'customer'
      AND p.resource = 'transactions'
      AND p.action = 'read'
      AND NOT EXISTS (
        SELECT 1 FROM roles_permissions rp
        WHERE rp."roleId" = r.id AND rp."permissionId" = p.id
      );
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove vendor, transaction, and file permissions
    await queryRunner.query(`
      DELETE FROM permissions
      WHERE resource IN ('vendors', 'transactions', 'files');
    `)
  }
}
