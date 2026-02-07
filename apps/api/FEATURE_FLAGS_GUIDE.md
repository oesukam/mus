# Feature Flags Guide

Complete guide to using the feature flags system in the MUS e-commerce platform.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Scope Types](#scope-types)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Overview

The feature flags system allows you to toggle features on/off without deploying code, enabling:

- **Gradual rollouts**: Release features to a percentage of users
- **A/B testing**: Test different features with different user groups
- **Kill switches**: Quickly disable problematic features
- **Role-based features**: Enable features only for specific roles
- **Beta testing**: Give early access to select users

## Quick Start

### 1. Protect a Route

```typescript
import { RequiresFeature, FEATURE_FLAG_KEYS } from "@/modules/features-flags"

@Controller("products")
export class ProductsController {
  // Simple usage - just one decorator!
  @Get("new-listing")
  @RequiresFeature("new-product-listing")
  async newProductListing() {
    // Only accessible if 'new-product-listing' flag is enabled
  }

  // Type-safe usage with constants
  @Get("beta-feature")
  @RequiresFeature(FEATURE_FLAG_KEYS.BETA_FEATURES)
  async betaFeature() {
    // IDE autocomplete + type checking!
  }
}
```

**Note**: No need for `@UseGuards(FeatureFlagGuard)` - it's automatic! 🎉

### 2. Check in Service Layer

```typescript
import { FeatureFlagsService } from "@/modules/features-flags"

@Injectable()
export class CheckoutService {
  constructor(private featureFlagsService: FeatureFlagsService) {}

  async processCheckout(user: User) {
    const useNewCheckout = await this.featureFlagsService.isFeatureEnabled("new-checkout", user)

    if (useNewCheckout) {
      return this.newCheckoutFlow()
    } else {
      return this.legacyCheckoutFlow()
    }
  }
}
```

### 3. Check from Frontend

```typescript
// Check single flag
const response = await fetch("/api/v1/auth/me/features-flags/new-checkout/check", {
  headers: { Authorization: `Bearer ${token}` },
})
const { isEnabled } = await response.json()

// Batch check multiple flags
const response = await fetch("/api/v1/auth/me/features-flags/check-batch", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    keys: ["new-checkout", "advanced-analytics", "beta-features"],
  }),
})
const { flags } = await response.json()
// flags = { 'new-checkout': true, 'advanced-analytics': false, ... }
```

## Scope Types

### 1. GLOBAL (All or Nothing)

```json
{
  "key": "maintenance-mode",
  "displayName": "Maintenance Mode",
  "scope": "global",
  "isEnabled": false
}
```

**Use case**: Simple on/off toggles that apply to everyone

---

### 2. USER (Specific Users)

```json
{
  "key": "beta-features",
  "displayName": "Beta Features",
  "scope": "user",
  "isEnabled": true,
  "rules": {
    "userIds": [1, 5, 12, 42]
  }
}
```

**Use case**: Beta testers, VIP users, internal testing

---

### 3. ROLE (Role-Based)

```json
{
  "key": "advanced-analytics",
  "displayName": "Advanced Analytics",
  "scope": "role",
  "isEnabled": true,
  "rules": {
    "roleNames": ["admin", "seller"]
  }
}
```

**Use case**: Admin-only features, seller tools, premium features

---

### 4. PERCENTAGE (Gradual Rollout)

```json
{
  "key": "new-ui",
  "displayName": "New UI Design",
  "scope": "percentage",
  "isEnabled": true,
  "rolloutPercentage": 25
}
```

**Use case**: Gradual rollouts (5% → 25% → 50% → 100%), A/B testing

**How it works**:

- Uses deterministic hash: `hash(userId:flagKey) % 100`
- Same user always gets same result (no flickering)
- Smooth distribution across user base

**Rollout strategy**:

```
Week 1: 10%  (test with small group)
Week 2: 25%  (expand if stable)
Week 3: 50%  (half of users)
Week 4: 100% (full rollout)
```

## API Reference

### Admin Endpoints (requires permissions)

#### Create Feature Flag

```http
POST /api/v1/admin/features-flags
Authorization: Bearer <token>
Permissions: features-flags:write

{
  "key": "new-feature",
  "displayName": "New Feature",
  "description": "Description of the feature",
  "isEnabled": false,
  "scope": "global"
}
```

#### List All Flags

```http
GET /api/v1/admin/features-flags
Authorization: Bearer <token>
Permissions: features-flags:read
```

#### Get Flag by ID

```http
GET /api/v1/admin/features-flags/:id
Authorization: Bearer <token>
Permissions: features-flags:read
```

#### Update Flag

```http
PUT /api/v1/admin/features-flags/:id
Authorization: Bearer <token>
Permissions: features-flags:write

{
  "displayName": "Updated Name",
  "isEnabled": true
}
```

#### Toggle Flag On/Off

```http
PATCH /api/v1/admin/features-flags/:id/toggle
Authorization: Bearer <token>
Permissions: features-flags:write

{
  "isEnabled": true
}
```

#### Delete Flag

```http
DELETE /api/v1/admin/features-flags/:id
Authorization: Bearer <token>
Permissions: features-flags:delete
```

#### Seed Default Flags

```http
POST /api/v1/admin/features-flags/seed
Authorization: Bearer <token>
Permissions: features-flags:write
```

---

### User Endpoints (authenticated)

#### Check Single Flag

```http
GET /api/v1/auth/me/features-flags/:key/check
Authorization: Bearer <token>

Response:
{
  "key": "new-checkout",
  "isEnabled": true
}
```

#### Batch Check Flags

```http
POST /api/v1/auth/me/features-flags/check-batch
Authorization: Bearer <token>

Request:
{
  "keys": ["flag1", "flag2", "flag3"]
}

Response:
{
  "flags": {
    "flag1": true,
    "flag2": false,
    "flag3": true
  }
}
```

#### Get All Enabled Flags

```http
GET /api/v1/auth/me/features-flags/enabled
Authorization: Bearer <token>

Response:
{
  "features": ["new-checkout", "advanced-analytics"]
}
```

## Usage Examples

### Example 1: Simple Feature Toggle

```typescript
// Backend - Protect route
@Get('new-dashboard')
@RequiresFeature('new-dashboard')
async newDashboard() {
  return this.dashboardService.getNewDashboard();
}
```

```typescript
// Admin - Enable the flag
PATCH /api/v1/admin/features-flags/1/toggle
{ "isEnabled": true }
```

---

### Example 2: Gradual Rollout

```typescript
// Create percentage-based flag
POST /api/v1/admin/features-flags
{
  "key": "redesigned-checkout",
  "displayName": "Redesigned Checkout",
  "scope": "percentage",
  "rolloutPercentage": 10,
  "isEnabled": true
}

// Week 1: 10% of users see new checkout
// Week 2: Increase to 25%
PUT /api/v1/admin/features-flags/5
{ "rolloutPercentage": 25 }

// Week 3: Increase to 50%
PUT /api/v1/admin/features-flags/5
{ "rolloutPercentage": 50 }

// Week 4: Full rollout
PUT /api/v1/admin/features-flags/5
{ "scope": "global", "rolloutPercentage": null }
```

---

### Example 3: Beta Testing Program

```typescript
// Create user-scoped flag
POST /api/v1/admin/features-flags
{
  "key": "beta-program",
  "displayName": "Beta Program Access",
  "scope": "user",
  "isEnabled": true,
  "rules": {
    "userIds": [1, 2, 3]  // Beta testers
  }
}

// Add more beta testers
PUT /api/v1/admin/features-flags/3
{
  "rules": {
    "userIds": [1, 2, 3, 15, 27, 42]
  }
}
```

---

### Example 4: A/B Testing

```typescript
@Injectable()
export class ProductService {
  constructor(private featureFlagsService: FeatureFlagsService) {}

  async getProductRecommendations(user: User) {
    const useNewAlgorithm = await this.featureFlagsService.isFeatureEnabled(
      "new-recommendation-algorithm",
      user,
    )

    if (useNewAlgorithm) {
      // Group A - New ML-based algorithm
      return this.mlRecommendations(user)
    } else {
      // Group B - Traditional algorithm
      return this.traditionalRecommendations(user)
    }
  }
}
```

---

### Example 5: Multiple Flags Check

```typescript
@Injectable()
export class UIService {
  constructor(private featureFlagsService: FeatureFlagsService) {}

  async getUserUIConfig(user: User) {
    const flags = await this.featureFlagsService.batchCheckFeatures(
      ["dark-mode", "new-navigation", "advanced-search", "beta-features"],
      user,
    )

    return {
      darkMode: flags["dark-mode"],
      newNavigation: flags["new-navigation"],
      advancedSearch: flags["advanced-search"],
      betaFeatures: flags["beta-features"],
    }
  }
}
```

## Best Practices

### 1. Use Type-Safe Constants

```typescript
// ✅ Good - Type safe
import { FEATURE_FLAG_KEYS } from '@/modules/features-flags';

@RequiresFeature(FEATURE_FLAG_KEYS.BETA_FEATURES)

// ❌ Bad - Typo prone
@RequiresFeature('beta-featurs')  // Typo!
```

### 2. Clean Up Old Flags

```typescript
// After full rollout, remove the flag and update code
// Before:
if (await this.featureFlagsService.isFeatureEnabled("new-checkout", user)) {
  return this.newCheckout()
} else {
  return this.oldCheckout()
}

// After (when new-checkout is 100%):
return this.newCheckout()
// Delete 'new-checkout' flag from database
```

### 3. Use Descriptive Names

```typescript
// ✅ Good
"redesigned-product-page"
"ml-based-recommendations"
"stripe-payment-integration"

// ❌ Bad
"feature-1"
"new-thing"
"test"
```

### 4. Document Your Flags

```typescript
POST /features-flags
{
  "key": "instant-checkout",
  "displayName": "Instant Checkout (One-Click)",
  "description": "Allows users to checkout with one click using saved payment methods. Part of Q2 2024 conversion optimization initiative.",
  "scope": "percentage",
  "rolloutPercentage": 10
}
```

### 5. Monitor Flag Usage

```typescript
// The service automatically logs all operations
// Check logs for:
// - Feature flag created: new-checkout (enabled: false)
// - Feature flag toggled: new-checkout -> enabled
// - Feature flag "new-checkout" not found, defaulting to disabled
```

### 6. Cache Awareness

- Flags are cached for 5 minutes in Redis
- Cache is auto-invalidated on updates
- If you need immediate updates across all servers, toggle twice:
  ```typescript
  // Force cache clear
  PATCH /api/v1/admin/features-flags/1/toggle { "isEnabled": false }
  PATCH /api/v1/admin/features-flags/1/toggle { "isEnabled": true }
  ```

### 7. Rollout Strategy

**Conservative Approach** (recommended for critical features):

```
Day 1:  Internal team only (user scope)
Week 1: 5% of users
Week 2: 25% of users
Week 3: 50% of users
Week 4: 100% full rollout
```

**Aggressive Approach** (for low-risk features):

```
Day 1:  25% of users
Day 3:  50% of users
Week 1: 100% full rollout
```

## Performance Considerations

### Redis Caching

- All flags are cached for 5 minutes
- Database queries only on cache miss
- Automatic cache invalidation on updates

### Batch Checks

- Use `check-batch` endpoint for multiple flags
- Processes in parallel
- Single API call vs multiple

```typescript
// ❌ Bad - Multiple API calls
const flag1 = await fetch("/api/v1/auth/me/features-flags/flag1/check")
const flag2 = await fetch("/api/v1/auth/me/features-flags/flag2/check")
const flag3 = await fetch("/api/v1/auth/me/features-flags/flag3/check")

// ✅ Good - Single API call
const flags = await fetch("/api/v1/auth/me/features-flags/check-batch", {
  method: "POST",
  body: JSON.stringify({ keys: ["flag1", "flag2", "flag3"] }),
})
```

## Troubleshooting

### Flag Not Working

1. **Check if flag exists**: `GET /api/v1/admin/features-flags`
2. **Check if enabled**: Look at `isEnabled` field
3. **Check scope**:
   - `user` scope requires user in `rules.userIds`
   - `role` scope requires user has one of `rules.roleNames`
   - `percentage` scope is probabilistic
4. **Check cache**: Flags are cached for 5 minutes
5. **Check logs**: Service logs all flag checks

### Cache Issues

```typescript
// Clear cache by toggling
PATCH /api/v1/admin/features-flags/:id/toggle { "isEnabled": false }
PATCH /api/v1/admin/features-flags/:id/toggle { "isEnabled": true }
```

### Permission Denied

Ensure user has required permissions:

- `features-flags:read` - View flags
- `features-flags:write` - Create/update/toggle flags
- `features-flags:delete` - Delete flags

## Migration & Setup

Feature flags are automatically set up via migration:

- Table: `features_flags`
- Default flags are seeded
- Permissions are created and assigned to admin role

To manually seed:

```http
POST /api/v1/admin/features-flags/seed
```

---

**Need help?** Check the API documentation or contact the development team.
