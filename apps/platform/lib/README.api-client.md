# API Client User-Agent Implementation

## Overview

All HTTP requests from the MUS Platform to the backend API now include a `User-Agent` header to properly identify the client making the requests.

## User-Agent Format

```
MUS-Platform/{version} (Next.js; {runtime})
```

### Examples

**Server-side requests** (during SSR, ISR, or API routes):
```
MUS-Platform/0.1.0 (Next.js; Server)
```

**Client-side requests** (from browser):
```
MUS-Platform/0.1.0 (Next.js; Browser)
```

## Implementation Details

### Location
- **File**: `lib/api-client.ts`
- **Class**: `ApiClient`

### How it works

1. The `ApiClient` class constructor detects the runtime environment:
   - Checks if `window` is defined to determine if running in browser or server
   - Creates appropriate User-Agent string

2. The User-Agent header is automatically added to all requests in the `request()` method:
   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'User-Agent': this.userAgent,
     ...(authToken && { Authorization: `Bearer ${authToken}` }),
     ...headers,
   }
   ```

3. Custom headers passed in request options will override the default User-Agent if needed.

## Benefits

1. **Request Identification**: Backend can identify and log requests from the platform
2. **Analytics**: Track API usage by client type (server vs browser)
3. **Debugging**: Easier troubleshooting with client identification
4. **Version Tracking**: Backend can track which platform versions are making requests
5. **Rate Limiting**: Can apply different rate limits based on client type

## Backend Usage

The backend can access the User-Agent header from requests:

```typescript
// NestJS example
@Get('products')
async getProducts(@Headers('user-agent') userAgent: string) {
  console.log('Request from:', userAgent)
  // => "MUS-Platform/0.1.0 (Next.js; Server)"
}
```

## API Endpoints Affected

All API endpoints accessed through `apiClient` include the User-Agent header:

- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/products` - Product listing
- `/api/v1/products/search` - Product search
- `/api/v1/products/:slug` - Single product
- All other endpoints using the shared `apiClient`

## Testing

To verify the User-Agent is being sent, you can:

1. Check backend logs for incoming requests
2. Use browser DevTools Network tab to inspect request headers
3. Add backend endpoint logging to capture User-Agent values

## Version Updates

When updating the platform version:

1. Update `PLATFORM_VERSION` constant in `lib/api-client.ts`
2. Should match the version in `package.json`
3. Consider using an automated sync with package.json version
