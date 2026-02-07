import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFeatureFlagsTable1730730000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create features_flags table
    await queryRunner.createTable(
      new Table({
        name: 'features_flags',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'displayName',
            type: 'varchar',
            length: '200',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'isEnabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'scope',
            type: 'enum',
            enum: ['global', 'user', 'role', 'percentage'],
            default: "'global'",
          },
          {
            name: 'rules',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'rolloutPercentage',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Seed default feature flags
    await queryRunner.query(`
      INSERT INTO features_flags (key, "displayName", description, "isEnabled", scope, rules, "rolloutPercentage") VALUES
      ('new-checkout', 'New Checkout Experience', 'Enable the new checkout flow with improved UX', false, 'global', NULL, NULL),
      ('advanced-analytics', 'Advanced Analytics Dashboard', 'Enable advanced analytics features for admin users', false, 'role', '{"roleNames": ["admin"]}', NULL),
      ('beta-features', 'Beta Features Access', 'Enable access to beta features for selected users', false, 'user', '{"userIds": []}', NULL),
      ('gradual-rollout-feature', 'Gradual Rollout Feature', 'Feature enabled for a percentage of users for gradual rollout', false, 'percentage', NULL, 50);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('features_flags');
  }
}
