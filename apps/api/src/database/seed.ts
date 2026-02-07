import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { seedBooks } from '../modules/products/seeders/books.seeder';
import { seedFeatureFlags } from '../modules/features-flags/seeders/feature-flags.seeder';

// Load environment variables
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function runSeeders() {
  try {
    await AppDataSource.initialize();
    console.log('📡 Database connection established');

    console.log('\n🌱 Starting seeders...\n');

    // Run feature flags seeder first (no dependencies)
    console.log('📊 Seeding Feature Flags...');
    await seedFeatureFlags(AppDataSource);

    // Run products seeder
    console.log('📚 Seeding Products...');
    await seedBooks(AppDataSource);

    console.log('\n✅ All seeders completed successfully!\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

runSeeders();
