# User-Agent Handling in API

## Overview

The API now supports User-Agent header parsing and logging for better request tracking and analytics.

## Platform User-Agent Format

All requests from the MUS Platform include a User-Agent header in this format:

```
MUS-Platform/{version} (Next.js; {runtime})
```

**Examples:**
- Server-side: `MUS-Platform/0.1.0 (Next.js; Server)`
- Client-side: `MUS-Platform/0.1.0 (Next.js; Browser)`

## Available Tools

### 1. @UserAgent() Decorator

Extract the User-Agent header in your controller methods.

**File:** `src/common/decorators/user-agent.decorator.ts`

**Example:**
```typescript
import { Controller, Get } from '@nestjs/common'
import { UserAgent } from '@/common/decorators/user-agent.decorator'

@Controller('products')
export class ProductsController {
  @Get()
  async findAll(@UserAgent() userAgent: string) {
    console.log('Request from:', userAgent)
    // => "MUS-Platform/0.1.0 (Next.js; Server)"

    return await this.productsService.findAll()
  }
}
```

### 2. parseUserAgent() Helper

Parse User-Agent strings to extract structured information.

**Example:**
```typescript
import { parseUserAgent } from '@/common/decorators/user-agent.decorator'

const ua = parseUserAgent('MUS-Platform/0.1.0 (Next.js; Server)')

console.log(ua)
// {
//   platform: 'MUS-Platform',
//   version: '0.1.0',
//   framework: 'Next.js',
//   runtime: 'Server',
//   raw: 'MUS-Platform/0.1.0 (Next.js; Server)'
// }
```

### 3. UserAgentLoggerInterceptor

Automatically log all requests with User-Agent information.

**File:** `src/common/interceptors/user-agent-logger.interceptor.ts`

**Global Usage (in `main.ts`):**
```typescript
import { UserAgentLoggerInterceptor } from './common/interceptors/user-agent-logger.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Apply globally to all routes
  app.useGlobalInterceptors(new UserAgentLoggerInterceptor())

  await app.listen(4000)
}
```

**Controller-level Usage:**
```typescript
import { Controller, UseInterceptors } from '@nestjs/common'
import { UserAgentLoggerInterceptor } from '@/common/interceptors/user-agent-logger.interceptor'

@Controller('products')
@UseInterceptors(UserAgentLoggerInterceptor)
export class ProductsController {
  // All routes in this controller will log User-Agent
}
```

**Route-level Usage:**
```typescript
@Get('search')
@UseInterceptors(UserAgentLoggerInterceptor)
async search() {
  // Only this route will log User-Agent
}
```

## Advanced Use Cases

### 1. Different Behavior Based on Client Type

```typescript
import { Controller, Get } from '@nestjs/common'
import { UserAgent, parseUserAgent } from '@/common/decorators/user-agent.decorator'

@Controller('products')
export class ProductsController {
  @Get()
  async findAll(@UserAgent() userAgent: string) {
    const parsed = parseUserAgent(userAgent)

    // Different caching strategy based on runtime
    if (parsed.runtime === 'Server') {
      // Server-side requests - aggressive caching
      return await this.productsService.findAll({ cache: 3600 })
    } else {
      // Browser requests - shorter cache
      return await this.productsService.findAll({ cache: 300 })
    }
  }
}
```

### 2. Analytics and Metrics

```typescript
import { Injectable } from '@nestjs/common'
import { UserAgent, parseUserAgent } from '@/common/decorators/user-agent.decorator'

@Injectable()
export class AnalyticsService {
  async trackRequest(endpoint: string, @UserAgent() userAgent: string) {
    const parsed = parseUserAgent(userAgent)

    await this.metricsRepository.save({
      endpoint,
      platform: parsed.platform,
      version: parsed.version,
      runtime: parsed.runtime,
      timestamp: new Date(),
    })
  }
}
```

### 3. Rate Limiting by Client Type

```typescript
import { Injectable } from '@nestjs/common'
import { UserAgent, parseUserAgent } from '@/common/decorators/user-agent.decorator'

@Injectable()
export class RateLimitService {
  getLimit(@UserAgent() userAgent: string): number {
    const parsed = parseUserAgent(userAgent)

    // More generous limits for server-side requests
    if (parsed.runtime === 'Server') {
      return 1000 // requests per minute
    }

    // Standard limits for browser requests
    return 100 // requests per minute
  }
}
```

### 4. Version-based Feature Flags

```typescript
import { Controller, Get, BadRequestException } from '@nestjs/common'
import { UserAgent, parseUserAgent } from '@/common/decorators/user-agent.decorator'
import * as semver from 'semver'

@Controller('products')
export class ProductsController {
  @Get('v2/search')
  async searchV2(@UserAgent() userAgent: string) {
    const parsed = parseUserAgent(userAgent)

    // Require minimum platform version for new features
    if (parsed.version && semver.lt(parsed.version, '0.2.0')) {
      throw new BadRequestException(
        'This endpoint requires MUS-Platform version 0.2.0 or higher'
      )
    }

    return await this.productsService.searchV2()
  }
}
```

## Logging Output

When using `UserAgentLoggerInterceptor`, logs will include:

```json
{
  "message": "Request processed",
  "method": "GET",
  "url": "/api/v1/products",
  "ip": "::1",
  "responseTime": "45ms",
  "userAgent": {
    "platform": "MUS-Platform",
    "version": "0.1.0",
    "runtime": "Server"
  }
}
```

For non-MUS Platform requests (e.g., browsers, curl):
```json
{
  "message": "Request processed",
  "method": "GET",
  "url": "/api/v1/products",
  "ip": "::1",
  "responseTime": "45ms",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)..."
}
```

## Benefits

1. **Request Tracking**: Identify which requests come from platform vs other clients
2. **Analytics**: Track usage by client type and version
3. **Performance Optimization**: Apply different strategies based on runtime
4. **Version Management**: Enforce minimum version requirements
5. **Debugging**: Easier troubleshooting with client identification
6. **Rate Limiting**: Apply appropriate limits based on client type
7. **Feature Flags**: Roll out features to specific platform versions

## Best Practices

1. **Always validate User-Agent**: Don't assume it will always be present
   ```typescript
   const parsed = parseUserAgent(userAgent || '')
   if (parsed.platform === 'MUS-Platform') {
     // Handle MUS Platform requests
   }
   ```

2. **Use structured logging**: Log parsed User-Agent data for better analytics
3. **Version comparison**: Use semver for version comparisons
4. **Graceful degradation**: Handle missing or malformed User-Agent headers
5. **Privacy**: Don't store personally identifiable information from User-Agent

## Testing

### Unit Test Example

```typescript
import { parseUserAgent } from './user-agent.decorator'

describe('parseUserAgent', () => {
  it('should parse MUS Platform User-Agent', () => {
    const result = parseUserAgent('MUS-Platform/0.1.0 (Next.js; Server)')

    expect(result.platform).toBe('MUS-Platform')
    expect(result.version).toBe('0.1.0')
    expect(result.framework).toBe('Next.js')
    expect(result.runtime).toBe('Server')
  })

  it('should handle invalid User-Agent', () => {
    const result = parseUserAgent('InvalidUserAgent')

    expect(result.platform).toBeUndefined()
    expect(result.raw).toBe('InvalidUserAgent')
  })
})
```

### Integration Test Example

```typescript
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

describe('Products API with User-Agent', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  it('should accept MUS Platform User-Agent', () => {
    return request(app.getHttpServer())
      .get('/api/v1/products')
      .set('User-Agent', 'MUS-Platform/0.1.0 (Next.js; Server)')
      .expect(200)
  })
})
```
