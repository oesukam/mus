import "dotenv/config"
import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import { NestExpressApplication } from "@nestjs/platform-express"
import { HttpExceptionFilter } from "./common/filters/http-exception.filter"
import { join } from "path"
import expressBasicAuth from "express-basic-auth"
import { swaggerDefaultErrorResponsesPlugin } from "./common/utils/swagger-default-responses"
import { SwaggerResponseComponents } from "./common/constants/swagger-components"
import logger from "./common/utils/winston-logger"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Set global API prefix
  app.setGlobalPrefix("api/v1")

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, "..", "public"))

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
  })

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter())

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Swagger configuration with environment-based protection
  const environment = process.env.NODE_ENV || "development"
  const swaggerEnabled = process.env.SWAGGER_ENABLED !== "false" // Can be explicitly disabled

  if (swaggerEnabled) {
    // Add basic auth protection for production and staging
    if (environment === "production" || environment === "staging") {
      const swaggerUser = process.env.SWAGGER_USER || "swagger$user"
      const swaggerPassword = process.env.SWAGGER_PASSWORD || "swagger#user#pass"

      app.use(
        ["/api/v1/docs", "/api/v1/docs-json"],
        expressBasicAuth({
          challenge: true,
          users: {
            [swaggerUser]: swaggerPassword,
          },
        }),
      )

      console.log(`⚠️  Swagger is protected with HTTP Basic Auth (${environment} environment)`)
    }

    const config = new DocumentBuilder()
      .setTitle("E-Commerce API")
      .setDescription("E-Commerce API documentation")
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth",
      )
      .build()
    const document = SwaggerModule.createDocument(app, config)

    // Initialize components if not exists
    if (!document.components) {
      document.components = {}
    }

    // Add response components for error handling
    document.components.responses = SwaggerResponseComponents

    // Add additionalProperties: false to all schemas
    if (document?.components?.schemas) {
      Object.keys(document.components.schemas).forEach((key) => {
        const schema = document.components.schemas[key]
        if (schema && typeof schema === "object" && !("$ref" in schema)) {
          schema.additionalProperties = false
        }
      })
    }

    // Apply the plugin to add default error responses to all endpoints
    swaggerDefaultErrorResponsesPlugin(document)

    SwaggerModule.setup("api/v1/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customJs: ["/swagger-custom.js"],
    })

    logger.info(`📚 Swagger docs available at: /api/v1/docs (${environment} environment)`)
  } else {
    logger.info("📚 Swagger documentation is disabled")
  }

  const port = process.env.PORT || 4000
  await app.listen(port)
  logger.info(`🚀 API is running on: http://localhost:${port}`)
  logger.info(`Swagger docs available at: http://localhost:${port}/api/v1/docs`)
}
bootstrap()
