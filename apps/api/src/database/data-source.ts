import "dotenv/config"
import { DataSource, DataSourceOptions } from "typeorm"
import { join } from "path"

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "ecommerce",
  entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
  migrations: [join(__dirname, "../migrations/*{.ts,.js}")],
  synchronize: false, // Always false for migrations
  logging: process.env.DB_LOGGING === "true",
}

const dataSource = new DataSource(dataSourceOptions)

export default dataSource
