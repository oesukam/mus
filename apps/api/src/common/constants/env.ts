import "dotenv/config"

const { NODE_ENV } = process.env

export const PORT = process.env.PORT || 4000
export const API_VERSION = process.env.API_VERSION || "v1"
export const POSTGRES_HOST = process.env.POSTGRES_HOST
export const POSTGRES_PORT = Number(process.env.POSTGRES_PORT)
export const POSTGRES_USER = process.env.POSTGRES_USER
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD
export const POSTGRES_DB = process.env.POSTGRES_DB

export const isProduction = NODE_ENV === "production"
export const isTest = NODE_ENV === "test"
export const isStaging = NODE_ENV === "staging"
export const isDevelopment = NODE_ENV === "development"

export const DATADOG_API_KEY = process.env.DATADOG_API_KEY

export const IS_CRON_APP = process.env.APP_NAME === "cron"

export const AI_PROVIDER_ENCRYPTION_SECRET =
  process.env.AI_PROVIDER_ENCRYPTION_SECRET || "your-secret-key"

export const env = {
  isDevelopment,
  isProduction,
  isTest,
  isStaging,
  POSTGRES_HOST,
  POSTGRES_PORT,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
  POSTGRES_DB,
  AI_PROVIDER_ENCRYPTION_SECRET,
}

export const maskedRequestHeader = ["x-api-key", "cookie", "authorization"]

export const maskedRequestBody = [...maskedRequestHeader]

export const DEFAULT_OTP_FOR_TESTING = process.env.DEFAULT_OTP_FOR_TESTING || "320986"

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
export const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/auth/google-callback`
export const APP_CLIENT_URI = process.env.APP_CLIENT_URI || "http://localhost:5173"
