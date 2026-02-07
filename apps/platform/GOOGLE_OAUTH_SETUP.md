# Google OAuth Setup Instructions

## Overview
The Google OAuth flow has been updated to properly redirect users back to the frontend after successful authentication.

## How It Works

### Flow Diagram
```
User clicks "Login with Google"
       ↓
Frontend redirects to: http://localhost:4000/api/v1/auth/google
       ↓
Backend redirects to: Google OAuth consent screen
       ↓
User authorizes app
       ↓
Google redirects to: http://localhost:4000/api/v1/auth/google/callback
       ↓
Backend validates user & generates JWT token
       ↓
Backend redirects to: http://localhost:3000/auth/callback?token=...&user=...
       ↓
Frontend callback page extracts token & user data
       ↓
Frontend stores token in localStorage & updates auth state
       ↓
Frontend redirects to: http://localhost:3000/ (home page)
```

## Required Google Cloud Console Configuration

### 1. Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" → "Credentials"

### 2. Configure OAuth 2.0 Client ID

#### Authorized JavaScript Origins
Add these origins:
```
http://localhost:3000
http://localhost:4000
```

#### Authorized Redirect URIs
Add this redirect URI:
```
http://localhost:4000/api/v1/auth/google/callback
```

**Important**: The redirect URI must match EXACTLY what's configured in your backend `.env` file.

## Testing the OAuth Flow

### Prerequisites
1. Backend API running: `http://localhost:4000`
2. Frontend app running: `http://localhost:3000`
3. Google OAuth credentials configured in backend `.env`
4. Google Cloud Console redirect URIs configured

### Test Steps

1. **Start Services**
   ```bash
   # Terminal 1: Start backend
   cd apps/api
   yarn dev

   # Terminal 2: Start frontend
   cd apps/platform
   yarn dev
   ```

2. **Test OAuth Flow**
   - Open browser to `http://localhost:3000`
   - Click "Login" or "Sign up" button
   - Click "Login with Google" button
   - Browser should redirect to Google OAuth consent screen
   - Sign in with your Google account
   - Authorize the application
   - You should be redirected back to `http://localhost:3000`
   - You should now be logged in

### Common Issues

#### "redirect_uri_mismatch" error
**Solution**: The redirect URI in Google Cloud Console doesn't match.
- Verify redirect URI: `http://localhost:4000/api/v1/auth/google/callback`
- No trailing slashes
- Check http vs https

#### User redirects but nothing happens
**Solution**: Check browser console for errors
- Verify URL parameters exist
- Check for JSON parsing errors

## Files Changed

### Backend
- `apps/api/src/modules/auth/auth.controller.ts` - Redirects to frontend
- `apps/api/.env` - Added `FRONTEND_URL=http://localhost:3000`

### Frontend
- `apps/platform/app/auth/callback/page.tsx` - New OAuth callback handler
