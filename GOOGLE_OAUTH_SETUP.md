# Google OAuth Setup Guide

This guide explains how to set up Google OAuth 2.0 authentication for the MUS e-commerce API.

## Overview

The application supports Google Sign-In using OAuth 2.0, allowing users to authenticate with their Google accounts. This integration uses Passport.js with the `passport-google-oauth20` strategy.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- The application's domain or localhost for development

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click **"New Project"**
4. Enter a project name (e.g., "MUS E-Commerce")
5. Click **"Create"**

### 2. Enable Google+ API (Optional but Recommended)

1. In the Google Cloud Console, navigate to **"APIs & Services" > "Library"**
2. Search for **"Google+ API"** or **"Google People API"**
3. Click on it and click **"Enable"**

Note: The People API provides access to user profile information.

### 3. Configure OAuth Consent Screen

Before creating credentials, you must configure the OAuth consent screen:

1. Go to **"APIs & Services" > "OAuth consent screen"**
2. Choose **"External"** user type (for testing) or **"Internal"** (if using Google Workspace)
3. Click **"Create"**

#### Fill in the required information:

**App Information:**
- **App name:** MUS E-Commerce (or your app name)
- **User support email:** Your email address
- **App logo:** (Optional) Upload your app logo

**App domain:**
- **Application home page:** `http://localhost:3000` (for development)
- **Application privacy policy link:** (Optional for testing)
- **Application terms of service link:** (Optional for testing)

**Authorized domains:**
- For production: Add your domain (e.g., `example.com`)
- For development: Leave empty or add `localhost`

**Developer contact information:**
- Add your email address

4. Click **"Save and Continue"**

#### Scopes:
5. Click **"Add or Remove Scopes"**
6. Select the following scopes:
   - `userinfo.email`
   - `userinfo.profile`
7. Click **"Update"** and then **"Save and Continue"**

#### Test users (for External apps in testing):
8. Add test user emails if your app is in testing mode
9. Click **"Save and Continue"**

10. Review the summary and click **"Back to Dashboard"**

### 4. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services" > "Credentials"**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth client ID"**

#### Configure the OAuth client:

- **Application type:** Select **"Web application"**
- **Name:** MUS E-Commerce Web Client (or any descriptive name)

**Authorized JavaScript origins:**
- For development: `http://localhost:3000`
- For production: `https://yourdomain.com`

**Authorized redirect URIs:**
- For development: `http://localhost:4000/api/v1/auth/google/callback`
- For production: `https://api.yourdomain.com/api/v1/auth/google/callback`

Note: The redirect URI must match exactly what's configured in your application.

5. Click **"Create"**

### 5. Copy Your Credentials

After creating the OAuth client, you'll see a dialog with your credentials:

- **Client ID:** Something like `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret:** Something like `GOCSPX-abcdef123456`

**Important:** Copy these values immediately. You'll need them for your application configuration.

### 6. Configure Your Application

Add the credentials to your environment variables:

#### Development (.env file):

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback

# Frontend URL (for redirects after authentication)
FRONTEND_URL=http://localhost:3000
```

#### Production:

Set the same environment variables in your production environment with your production URLs:

```env
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/v1/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

### 7. Update docker-compose.yml (if using Docker)

Add the Google OAuth environment variables to your `docker-compose.yml`:

```yaml
api:
  environment:
    - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
    - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
    - GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL}
    - FRONTEND_URL=${FRONTEND_URL}
```

### 8. Test the Integration

1. Start your application:
   ```bash
   docker-compose up
   # or
   pnpm dev
   ```

2. Navigate to the Google sign-in endpoint:
   ```
   http://localhost:4000/api/v1/auth/google
   ```

3. You should be redirected to Google's consent screen
4. After successful authentication, you'll be redirected back to your application with a JWT token

## API Endpoints

### Initiate Google Sign-In

```
GET /api/v1/auth/google
```

Redirects the user to Google's OAuth consent screen.

### Google Callback

```
GET /api/v1/auth/google/callback
```

This is where Google redirects after authentication. The application handles the callback and:
1. Retrieves the user's Google profile
2. Creates or finds the user in the database
3. Generates a JWT token
4. Redirects to the frontend with the token

### Frontend Integration Example

```javascript
// Redirect user to Google OAuth
const handleGoogleSignIn = () => {
  window.location.href = 'http://localhost:4000/api/v1/auth/google';
};

// Handle the callback on your frontend
// The API will redirect to: FRONTEND_URL/auth/callback?token=JWT_TOKEN
// Parse the token from the URL and store it
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
if (token) {
  localStorage.setItem('authToken', token);
  // Redirect to dashboard or home
}
```

## Security Best Practices

1. **Keep credentials secret:** Never commit `.env` files to version control
2. **Use environment-specific credentials:** Different credentials for dev, staging, and production
3. **Restrict authorized domains:** Only add domains you control
4. **HTTPS in production:** Always use HTTPS for production OAuth callbacks
5. **Validate tokens:** Always verify JWT tokens on protected routes
6. **Rotate secrets regularly:** Periodically regenerate your client secret

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem:** The redirect URI doesn't match what's configured in Google Cloud Console.

**Solution:**
1. Check that the `GOOGLE_CALLBACK_URL` in your `.env` matches exactly
2. Verify the authorized redirect URI in Google Cloud Console
3. Ensure there are no trailing slashes or protocol mismatches (http vs https)

### Error: "Access blocked: This app's request is invalid"

**Problem:** OAuth consent screen not properly configured.

**Solution:**
1. Complete all required fields in the OAuth consent screen
2. Add your email as a test user if the app is in testing mode
3. Ensure required scopes are added (`userinfo.email`, `userinfo.profile`)

### Error: "invalid_client"

**Problem:** Client ID or Client Secret is incorrect.

**Solution:**
1. Verify the credentials in your `.env` file
2. Re-copy from Google Cloud Console
3. Ensure there are no extra spaces or quotes

### Users can't sign in

**Problem:** App is in testing mode and user is not added as a test user.

**Solution:**
1. Go to OAuth consent screen in Google Cloud Console
2. Add the user's email to "Test users"
3. Or publish your app (if ready for production)

## Publishing Your App

For production use, you need to verify your app:

1. Go to OAuth consent screen
2. Click **"Publish App"**
3. Fill in the verification questionnaire if required
4. Wait for Google's review (can take several days)

Until published, only test users can authenticate.

## Useful Links

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport Google OAuth20 Strategy](https://www.passportjs.org/packages/passport-google-oauth20/)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

## Related Files

- **Strategy Implementation:** `apps/api/src/modules/auth/strategies/google.strategy.ts`
- **Auth Controller:** `apps/api/src/modules/auth/auth.controller.ts`
- **Auth Service:** `apps/api/src/modules/auth/auth.service.ts`
- **Environment Config:** `apps/api/.env`

## Support

If you encounter issues not covered in this guide:

1. Check the [Google OAuth 2.0 Troubleshooting Guide](https://developers.google.com/identity/protocols/oauth2/policies)
2. Review your application logs for detailed error messages
3. Verify all URLs and credentials are correctly configured
