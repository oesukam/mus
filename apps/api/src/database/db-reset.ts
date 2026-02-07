/**
 * Database Reset Script
 *
 * This script will:
 * 1. Drop all tables (by dropping and recreating the schema)
 * 2. Run all migrations from scratch
 * 3. Seed the database with initial data
 *
 * Usage: yarn db:reset
 *
 * ⚠️  WARNING: This will DELETE ALL DATA in the database!
 * This command is ONLY allowed in development and staging environments.
 */

import "dotenv/config"
import dataSource from "./data-source"
import { execSync } from "child_process"

async function resetDatabase() {
  console.log("🔄 Starting complete database reset...")

  // Safety check: Only allow in development and staging
  const nodeEnv = process.env.NODE_ENV?.toLowerCase()
  const dbName = process.env.DB_NAME || dataSource.options.database

  // Block production
  if (nodeEnv === "production" || nodeEnv === "prod") {
    console.error("❌ BLOCKED: Database reset is not allowed in production environment!")
    console.error("   Current NODE_ENV:", nodeEnv)
    throw new Error("Database reset blocked: Production environment detected")
  }

  // Block production-like database names
  const productionDbNames = ["production", "prod", "live", "main"]
  if (productionDbNames.some((name) => String(dbName).toLowerCase().includes(name))) {
    console.error("❌ BLOCKED: Database name suggests production environment!")
    console.error("   Current DB_NAME:", dbName)
    console.error("   To reset this database, please use a development/staging database name.")
    throw new Error("Database reset blocked: Production database name detected")
  }

  // Only allow in development or staging
  const allowedEnvironments = ["development", "dev", "staging", "stage", "test", "testing"]
  if (nodeEnv && !allowedEnvironments.includes(nodeEnv)) {
    console.error("❌ BLOCKED: Database reset is only allowed in development or staging!")
    console.error("   Current NODE_ENV:", nodeEnv)
    console.error("   Allowed environments:", allowedEnvironments.join(", "))
    throw new Error("Database reset blocked: Invalid environment")
  }

  // Final confirmation for safety
  console.log("⚠️  WARNING: This will DELETE ALL DATA and RESEED the database!")
  console.log("   Environment:", nodeEnv || "not set (default: development)")
  console.log("   Database:", dbName)
  console.log("")

  try {
    // Step 1: Drop and recreate schema
    console.log("📡 Connecting to database...")
    await dataSource.initialize()
    console.log("✅ Connected to database")

    console.log("🗑️  Dropping schema 'public'...")
    await dataSource.query(`DROP SCHEMA IF EXISTS public CASCADE;`)
    console.log("✅ Schema dropped")

    console.log("🔨 Creating schema 'public'...")
    await dataSource.query(`CREATE SCHEMA public;`)
    console.log("✅ Schema created")

    // Grant permissions
    console.log("🔐 Granting permissions...")
    const username = process.env.DB_USERNAME || "postgres"
    await dataSource.query(`GRANT ALL ON SCHEMA public TO ${username};`)
    await dataSource.query(`GRANT ALL ON SCHEMA public TO public;`)
    console.log("✅ Permissions granted")

    // Close and reconnect
    await dataSource.destroy()
    console.log("🔌 Reconnecting to database...")
    await dataSource.initialize()

    // Step 2: Run migrations
    console.log("")
    console.log("🚀 Running migrations...")
    const migrations = await dataSource.runMigrations()

    if (migrations.length === 0) {
      console.log("ℹ️  No migrations to run")
    } else {
      console.log(`✅ Ran ${migrations.length} migration(s):`)
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`)
      })
    }

    // Close connection before seeding
    await dataSource.destroy()
    console.log("🔌 Database connection closed")

    // Step 3: Run seed
    console.log("")
    console.log("🌱 Seeding database...")
    try {
      // Run the seed script
      execSync("yarn seed", { stdio: "inherit" })
      console.log("✅ Database seeded successfully")
    } catch (error) {
      console.warn("⚠️  Seeding failed or skipped:", error instanceof Error ? error.message : error)
      console.log("   You can run 'yarn seed' manually if needed")
    }

    console.log("")
    console.log("🎉 Database reset completed successfully!")
    console.log("")
    console.log("Summary:")
    console.log("  ✅ Schema dropped and recreated")
    console.log(`  ✅ ${migrations.length} migration(s) executed`)
    console.log("  ✅ Database seeded with initial data")

  } catch (error) {
    console.error("❌ Database reset failed:", error)
    throw error
  } finally {
    // Ensure connection is closed
    if (dataSource.isInitialized) {
      await dataSource.destroy()
      console.log("🔌 Database connection closed")
    }
  }
}

// Run the reset
resetDatabase()
  .then(() => {
    console.log("✨ Done!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("💥 Fatal error:", error)
    process.exit(1)
  })
