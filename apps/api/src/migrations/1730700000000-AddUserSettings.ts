import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserSettings1730700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add notification settings columns
    await queryRunner.addColumns('users', [
      new TableColumn({
        name: 'notificationsOrderUpdates',
        type: 'boolean',
        default: true,
      }),
      new TableColumn({
        name: 'notificationsPromotions',
        type: 'boolean',
        default: true,
      }),
      new TableColumn({
        name: 'notificationsWishlistAlerts',
        type: 'boolean',
        default: true,
      }),
      new TableColumn({
        name: 'notificationsNewsletter',
        type: 'boolean',
        default: false,
      }),
      // Privacy settings columns
      new TableColumn({
        name: 'privacyShowProfile',
        type: 'boolean',
        default: true,
      }),
      new TableColumn({
        name: 'privacyShareData',
        type: 'boolean',
        default: false,
      }),
      // Preference columns
      new TableColumn({
        name: 'preferencesCurrency',
        type: 'varchar',
        length: '10',
        default: "'USD'",
      }),
      new TableColumn({
        name: 'preferencesLanguage',
        type: 'varchar',
        length: '10',
        default: "'en'",
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('users', [
      'notificationsOrderUpdates',
      'notificationsPromotions',
      'notificationsWishlistAlerts',
      'notificationsNewsletter',
      'privacyShowProfile',
      'privacyShareData',
      'preferencesCurrency',
      'preferencesLanguage',
    ]);
  }
}
