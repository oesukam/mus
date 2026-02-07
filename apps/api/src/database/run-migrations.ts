/**
 * Run pending database migrations
 *
 * Usage: ts-node -r tsconfig-paths/register src/database/run-migrations.ts
 */

import "dotenv/config"
import dataSource from "./data-source"

async function runMigrations() {
  console.log("🚀 Running pending migrations...")

  try {
    await dataSource.initialize()
    console.log("✅ Connected to database")

    const migrations = await dataSource.runMigrations()

    if (migrations.length === 0) {
      console.log("ℹ️  No pending migrations")
    } else {
      console.log(`✅ Ran ${migrations.length} migration(s):`)
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`)
      })
    }

    await dataSource.destroy()
    console.log("🔌 Database connection closed")
    process.exit(0)
  } catch (error) {
    console.error("❌ Migration failed:", error)
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
    process.exit(1)
  }
}

runMigrations()
