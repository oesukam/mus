# API Endpoints Changelog

## Changes Made

### Removed Duplicate Profile Endpoint

**Date**: 2025-11-05

#### What Changed
Removed duplicate GET profile endpoint from users module:
- ❌ Removed: `GET /api/v1/users/profile/me`
- ✅ Use instead: `GET /api/v1/auth/profile`

#### Why
The same functionality existed in two places:
1. `GET /api/v1/auth/profile` - Lightweight, returns user from JWT token
2. `GET /api/v1/users/profile/me` - Queries database for user data

The auth endpoint is more efficient and is already being used by the frontend.

#### Remaining User Endpoints
The users module still provides additional profile management functionality:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users/profile` | PATCH | Update current user profile (name, etc.) |
| `/api/v1/users/change-password` | POST | Change user password |

**Note**: Routes were also simplified:
- Old: `/api/v1/users/profile/me` → New: `/api/v1/users/profile`
- Old: `/api/v1/users/profile/change-password` → New: `/api/v1/users/change-password`

#### Migration Guide

If you were using the old endpoint, update your code:

**Before**:
```typescript
// Old endpoint
const response = await fetch('http://localhost:4000/api/v1/users/profile/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**After**:
```typescript
// New endpoint
const response = await fetch('http://localhost:4000/api/v1/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

#### Breaking Changes
- ❌ `GET /api/v1/users/profile/me` - **Removed**
- ⚠️ `PATCH /api/v1/users/profile/me` → `PATCH /api/v1/users/profile` - **Route changed**
- ⚠️ `POST /api/v1/users/profile/change-password` → `POST /api/v1/users/change-password` - **Route changed**

#### Frontend Integration
The frontend authentication is already using the correct endpoint (`/api/v1/auth/profile`), so no changes are needed in the platform app.
