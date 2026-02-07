import { createLogger, transports, format } from "winston"
import dayjs from "dayjs"

import { DATADOG_API_KEY, env, IS_CRON_APP } from "../constants/env"
import { omit } from "lodash"
import { RequestContext } from "./request-context"

const { NODE_ENV } = process.env

const transportsList: Array<any> = [new transports.Console()]

// Setup DATADOG only if the API KEY is set
if (DATADOG_API_KEY) {
  let service = `mus_api_${NODE_ENV}`.toLowerCase()
  if (IS_CRON_APP) {
    service += "_cron"
  }

  transportsList.push(
    new transports.Http({
      host: "http-intake.logs.us5.datadoghq.com",
      path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=mus-api&service=${service}&env=${NODE_ENV}`,
      ssl: true,
    }),
  )
}

const enrichWithContext = format((info) => {
  const context = RequestContext.get()

  return {
    ...info,
    ...(context?.logPayload || {}),
  }
})

// safely handles circular references
const safeStringify = (obj, indent = 2) => {
  let cache = []
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === "object" && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent,
  )
  cache = null
  return retVal
}

// Create a Winston logger that streams to Stackdriver Logging
// Logs will be written to: "projects/PROJECT_ID/logs/winston_log"
export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    enrichWithContext(), // attach request context
    format.printf(({ level, message, timestamp, ...resPayload }) => {
      try {
        const payload = {
          message,
          level,
          custom: {
            ...omit(resPayload, [Symbol.for("level")], [Symbol.for("splat")]),
          },
          timestamp: dayjs(timestamp as string).format(),
        }

        if (env.isDevelopment) {
          console.log(message, payload)
        }

        return safeStringify(payload)
      } catch (error) {
        logger.error(`LOGGER_ERROR: ${error.message}`, { error })
      }
    }),
  ),
  transports: transportsList,
})

export default logger
