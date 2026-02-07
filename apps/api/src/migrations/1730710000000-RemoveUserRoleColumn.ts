import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class RemoveUserRoleColumn1730710000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the legacy role column from users table
    // Users should use the roles relation instead (many-to-many with roles table)
    await queryRunner.dropColumn('users', 'role');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the role column with default value
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'varchar',
        default: "'customer'",
      })
    );
  }
}
