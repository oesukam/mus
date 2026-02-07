import { MiddlewareConsumer, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { CacheModule } from "@nestjs/cache-manager"
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler"
import { APP_GUARD } from "@nestjs/core"
import { redisStore } from "cache-manager-redis-yet"
import type { RedisClientOptions } from "redis"
import { ProductsModule } from "./modules/products/products.module"
import { UsersModule } from "./modules/users/users.module"
import { OrdersModule } from "./modules/orders/orders.module"
import { TransactionsModule } from "./modules/transactions/transactions.module"
import { VendorsModule } from "./modules/vendors/vendors.module"
import { AuthModule } from "./modules/auth/auth.module"
import { ContactModule } from "./modules/contact/contact.module"
import { EmailModule } from "./modules/email/email.module"
import { FeatureFlagModule } from "./modules/features-flags/feature-flag.module"
import { AnalyticsModule } from "./modules/analytics/analytics.module"
import { CartModule } from "./modules/cart/cart.module"
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard"
import { CommonModule } from "./common/common.module"
import { ContextMiddleware } from "./common/middlewares/context.middleware"
import { RequestMiddleware } from "./common/middlewares/request.middleware"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DB_HOST", "localhost"),
        port: configService.get("DB_PORT", 5432),
        username: configService.get("DB_USERNAME", "postgres"),
        password: configService.get("DB_PASSWORD", "postgres"),
        database: configService.get("DB_NAME", "ecommerce"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        migrations: [__dirname + "/migrations/*{.ts,.js}"],
        synchronize: false, // Disabled - using migrations instead
        migrationsRun: true, // Automatically run migrations on startup
        logging: configService.get("NODE_ENV") === "development",
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true, // Make cache available globally
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.get("REDIS_HOST", "localhost"),
            port: configService.get("REDIS_PORT", 6379),
          },
        }),
        // Default TTL in milliseconds (cache-manager v5)
        // For cache-manager-redis-yet, the store internally converts to seconds
        // Setting to 60000ms = 60 seconds = 1 minute
        ttl: 60000,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          name: "short",
          ttl: configService.get("THROTTLE_SHORT_TTL", 1000), // 1 second
          limit: configService.get("THROTTLE_SHORT_LIMIT", 10), // 10 requests per second
        },
        {
          name: "medium",
          ttl: configService.get("THROTTLE_MEDIUM_TTL", 10000), // 10 seconds
          limit: configService.get("THROTTLE_MEDIUM_LIMIT", 50), // 50 requests per 10 seconds
        },
        {
          name: "long",
          ttl: configService.get("THROTTLE_LONG_TTL", 60000), // 1 minute
          limit: configService.get("THROTTLE_LONG_LIMIT", 100), // 100 requests per minute
        },
      ],
      inject: [ConfigService],
    }),
    CommonModule,
    EmailModule,
    AuthModule,
    ProductsModule,
    UsersModule,
    OrdersModule,
    TransactionsModule,
    VendorsModule,
    ContactModule,
    FeatureFlagModule,
    AnalyticsModule,
    CartModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // NOTE: Global CacheInterceptor is disabled to prevent caching issues
    // Individual modules use manual caching via CACHE_MANAGER for better control
    // and proper cache invalidation when data changes
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ContextMiddleware).forRoutes("*") // Attach context to all incoming requests
    consumer.apply(RequestMiddleware).forRoutes("*") // Log all incoming requests
  }
}
