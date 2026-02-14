import { DataSource } from "typeorm"
import { config } from "dotenv"
import { seedBooks } from "../modules/products/seeders/books.seeder"
import { seedBags } from "../modules/products/seeders/bags.seeder"
import { seedElectronics } from "../modules/products/seeders/electronics.seeder"
import { seedClothing } from "../modules/products/seeders/clothing.seeder"
import { seedAccessories } from "../modules/products/seeders/accessories.seeder"
import { seedHome } from "../modules/products/seeders/home.seeder"
import { seedSports } from "../modules/products/seeders/sports.seeder"
import { seedToys } from "../modules/products/seeders/toys.seeder"
import { seedFeatureFlags } from "../modules/features-flags/seeders/feature-flags.seeder"

// Load environment variables
config()

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "ecommerce",
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: false,
})

async function runSeeders() {
  try {
    await AppDataSource.initialize()
    console.log("📡 Database connection established")

    console.log("\n🌱 Starting seeders...\n")

    // Run feature flags seeder first (no dependencies)
    console.log("📊 Seeding Feature Flags...")
    await seedFeatureFlags(AppDataSource)

    // Run product seeders for all categories
    console.log("📚 Seeding Books...")
    await seedBooks(AppDataSource)

    console.log("👜 Seeding Bags...")
    await seedBags(AppDataSource)

    console.log("💻 Seeding Electronics...")
    await seedElectronics(AppDataSource)

    console.log("👕 Seeding Clothing...")
    await seedClothing(AppDataSource)

    console.log("💎 Seeding Accessories...")
    await seedAccessories(AppDataSource)

    console.log("🏠 Seeding Home Products...")
    await seedHome(AppDataSource)

    console.log("🏃 Seeding Sports Products...")
    await seedSports(AppDataSource)

    console.log("🧸 Seeding Toys...")
    await seedToys(AppDataSource)

    console.log("\n✅ All seeders completed successfully!\n")

    await AppDataSource.destroy()
    process.exit(0)
  } catch (error) {
    console.error("❌ Seeding failed:", error)
    await AppDataSource.destroy()
    process.exit(1)
  }
}

runSeeders()
