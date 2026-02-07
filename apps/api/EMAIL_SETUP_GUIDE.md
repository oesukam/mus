# Email Setup Guide - Resend Integration

Complete guide for setting up Resend as your transactional email provider.

## Table of Contents

- [Overview](#overview)
- [Why Resend?](#why-resend)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Domain Verification](#domain-verification)
- [Testing](#testing)
- [Email Templates](#email-templates)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Overview

This application uses **[Resend](https://resend.com)** for sending transactional emails. Resend provides:

- Simple API for sending emails
- Built-in email templates
- High deliverability rates
- Real-time email analytics
- Email threading support
- Generous free tier (3,000 emails/month)

---

## Why Resend?

### Advantages over SMTP providers:

1. **Developer-First API** - Simple REST API instead of SMTP configuration
2. **Better Deliverability** - Built-in best practices for email delivery
3. **Email Analytics** - Track opens, clicks, and bounces
4. **Free Tier** - 3,000 emails/month for free (perfect for development)
5. **Fast Setup** - No need to configure SMTP ports, authentication, etc.
6. **Email Preview** - Preview emails before sending
7. **Email Threading** - Built-in support for conversation threading

---

## Quick Start

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### Step 2: Get API Key

1. Navigate to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it (e.g., "MUS Store - Development")
4. Select permissions (Full Access for development)
5. Copy the API key (starts with `re_`)

### Step 3: Configure Environment

```bash
# .env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev  # Use this for testing
EMAIL_FROM_NAME=MUS Store
```

**Note**: For testing, you can use `onboarding@resend.dev` which is pre-verified by Resend.

### Step 4: Start Your Application

```bash
yarn dev
```

You should see in the logs:
```
[EmailService] Resend email service initialized successfully
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | Yes | - | Your Resend API key from resend.com/api-keys |
| `EMAIL_FROM` | No | `onboarding@resend.dev` | Sender email address (must be verified) |
| `EMAIL_FROM_NAME` | No | `MUS Store` | Sender display name |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL for email links |
| `DASHBOARD_URL` | No | `http://localhost:3001` | Dashboard URL for admin emails |

### Example Configurations

#### Development
```bash
RESEND_API_KEY=re_dev_xxxxxxxxxxxxxxxxx
EMAIL_FROM=onboarding@resend.dev
EMAIL_FROM_NAME=MUS Store (Dev)
FRONTEND_URL=http://localhost:3000
```

#### Staging
```bash
RESEND_API_KEY=re_staging_xxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@staging.yourdomain.com
EMAIL_FROM_NAME=MUS Store (Staging)
FRONTEND_URL=https://staging.yourdomain.com
```

#### Production
```bash
RESEND_API_KEY=re_prod_xxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=MUS Store
FRONTEND_URL=https://yourdomain.com
```

---

## Domain Verification

To send emails from your own domain (e.g., `noreply@yourdomain.com`), you need to verify it with Resend.

### Step 1: Add Your Domain

1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)

### Step 2: Add DNS Records

Resend will provide you with DNS records to add to your domain:

1. **SPF Record** (TXT):
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:amazonses.com ~all
   ```

2. **DKIM Records** (CNAME):
   ```
   Type: CNAME
   Name: resend._domainkey
   Value: resend._domainkey.yourdomain.com.resend.com
   ```

3. **DMARC Record** (TXT) - Optional but recommended:
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

### Step 3: Verify Domain

1. Add all DNS records to your domain provider (Cloudflare, Namecheap, etc.)
2. Wait for DNS propagation (5-30 minutes)
3. Click "Verify" in Resend dashboard
4. Status should change to "Verified" ✅

### Step 4: Update Environment

```bash
# Update your .env
EMAIL_FROM=noreply@yourdomain.com
```

---

## Testing

### Test Email Sending

Create a test endpoint or use the existing email methods:

#### Option 1: Via API Endpoint

```bash
# Test contact form email
curl -X POST http://localhost:4000/api/v1/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Subject",
    "message": "This is a test message"
  }'
```

#### Option 2: Via Code

```typescript
// In any controller or service
constructor(private emailService: EmailService) {}

async testEmail() {
  await this.emailService.sendEmail({
    to: 'your-email@example.com',
    subject: 'Test Email from MUS Store',
    html: '<h1>Hello!</h1><p>This is a test email from Resend.</p>',
  });
}
```

#### Option 3: Check Resend Dashboard

1. Go to [Resend Emails](https://resend.com/emails)
2. You should see your sent emails
3. Click on any email to see details, status, and preview

---

## Email Templates

The application includes several pre-built email templates:

### 1. Password Reset Email

```typescript
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'reset-token-here',
  'John Doe'
);
```

**Features:**
- Reset password button
- 1-hour expiry notice
- Professional styling

---

### 2. Welcome Email

```typescript
await emailService.sendWelcomeEmail(
  'newuser@example.com',
  'Jane Smith'
);
```

**Features:**
- Welcome message
- Feature highlights
- "Start Shopping" CTA

---

### 3. Payment Confirmation

```typescript
await emailService.sendPaymentConfirmation(
  'customer@example.com',
  'Customer Name',
  orderObject,
  transactionObject
);
```

**Features:**
- Order summary table
- Transaction details
- Track order button
- VAT breakdown

---

### 4. Contact Form Notification

```typescript
await emailService.sendContactNotification(
  contactId,
  'User Name',
  'user@example.com',
  'Subject',
  'Message content',
  'optional-message-id'
);
```

**Features:**
- Contact details
- Message content
- Dashboard link
- Reply-to header

---

### 5. Contact Reply

```typescript
await emailService.sendContactReply(
  'user@example.com',
  'User Name',
  'Original Subject',
  'Your reply message',
  'reply-message-id',
  'in-reply-to-id',
  'thread-id'
);
```

**Features:**
- Email threading (replies appear in same thread)
- Professional formatting
- Branded template

---

## Troubleshooting

### Issue: "Resend client not configured"

**Symptoms:**
```
[EmailService] WARN Resend client not configured. Email not sent.
```

**Solution:**
1. Check if `RESEND_API_KEY` is set in `.env`
2. Verify the API key is valid (starts with `re_`)
3. Restart your application

---

### Issue: "Failed to send email"

**Common Causes:**

#### 1. Invalid API Key
```bash
# Check your API key
echo $RESEND_API_KEY
# Should output: re_xxxxxx...
```

**Fix:** Get a new API key from [resend.com/api-keys](https://resend.com/api-keys)

---

#### 2. Unverified Domain

**Error:**
```json
{
  "error": {
    "message": "Domain not verified"
  }
}
```

**Fix:**
- Use `onboarding@resend.dev` for testing
- Or verify your domain in Resend dashboard

---

#### 3. Invalid Email Address

**Error:**
```json
{
  "error": {
    "message": "Invalid 'to' address"
  }
}
```

**Fix:** Ensure email addresses are valid format

---

### Issue: Emails Going to Spam

**Solutions:**

1. **Verify Domain** - Add SPF, DKIM, and DMARC records
2. **Use Professional Content** - Avoid spam trigger words
3. **Warm Up Domain** - Start with low volume, gradually increase
4. **Include Unsubscribe** - Add unsubscribe link (for marketing emails)
5. **Consistent Sender** - Use same FROM address

---

### Issue: Rate Limiting

**Free Tier Limits:**
- 3,000 emails/month
- 100 emails/day

**Error:**
```json
{
  "error": {
    "message": "Rate limit exceeded"
  }
}
```

**Solutions:**
1. Upgrade to paid plan for higher limits
2. Implement email queuing
3. Monitor usage in Resend dashboard

---

## Best Practices

### 1. Use Environment-Specific API Keys

```bash
# Development
RESEND_API_KEY=re_dev_xxxxxxxxx

# Staging
RESEND_API_KEY=re_staging_xxxxxxxxx

# Production
RESEND_API_KEY=re_prod_xxxxxxxxx
```

---

### 2. Always Include Text Version

```typescript
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  html: '<h1>Welcome</h1><p>Thanks for signing up!</p>',
  text: 'Welcome\n\nThanks for signing up!', // Always include text version
});
```

---

### 3. Use Reply-To for Better UX

```typescript
await emailService.sendEmail({
  to: 'customer@example.com',
  subject: 'Your Order Update',
  html: emailHtml,
  replyTo: 'support@yourdomain.com', // Customer replies go here
});
```

---

### 4. Monitor Email Analytics

Check these metrics regularly in Resend dashboard:

- **Delivery Rate** - Should be >99%
- **Open Rate** - Typical: 15-25%
- **Bounce Rate** - Should be <2%
- **Complaint Rate** - Should be <0.1%

---

### 5. Test Before Production

```typescript
// Create a test script
const testEmail = async () => {
  const templates = [
    'welcome',
    'password-reset',
    'payment-confirmation',
    'contact-notification',
  ];

  for (const template of templates) {
    console.log(`Testing ${template} template...`);
    // Send test email
    // Verify in Resend dashboard
  }
};
```

---

### 6. Handle Failures Gracefully

```typescript
const success = await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Important Update',
  html: emailHtml,
});

if (!success) {
  // Log to monitoring service (Sentry, DataDog, etc.)
  logger.error('Failed to send email to user@example.com');

  // Queue for retry
  await emailQueue.add({ /* email data */ });

  // Show user-friendly message
  return { message: 'Email will be sent shortly' };
}
```

---

### 7. Use Email Threading for Conversations

```typescript
// Initial contact email
const messageId = `contact-${contactId}@yourdomain.com`;
await emailService.sendContactNotification(
  contactId,
  name,
  email,
  subject,
  message,
  messageId // Set message ID for threading
);

// Reply to contact (will appear in same thread)
await emailService.sendContactReply(
  email,
  name,
  subject,
  replyMessage,
  `reply-${replyId}@yourdomain.com`, // New message ID
  messageId, // Reference original message
  messageId  // Thread ID
);
```

---

## Migration from SMTP2GO

If you're migrating from SMTP2GO (or any SMTP provider):

### What Changed

| Feature | SMTP2GO | Resend |
|---------|---------|--------|
| Setup | Complex (host, port, auth) | Simple (API key only) |
| SDK | nodemailer | Resend SDK |
| Authentication | Username/Password | API Key |
| Configuration | Multiple env vars | One env var |
| Email Preview | No | Yes (in dashboard) |
| Analytics | Limited | Comprehensive |

### Migration Steps

1. **Get Resend API Key** - From resend.com/api-keys
2. **Update Environment** - Replace SMTP vars with `RESEND_API_KEY`
3. **No Code Changes** - Email service interface remains the same
4. **Test Thoroughly** - Send test emails for each template
5. **Monitor** - Check Resend dashboard for delivery status

### Old Environment Variables (No Longer Needed)

```bash
# ❌ Remove these
SMTP2GO_HOST=
SMTP2GO_PORT=
SMTP2GO_USERNAME=
SMTP2GO_PASSWORD=
```

### New Environment Variables

```bash
# ✅ Use these
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=MUS Store
```

---

## API Reference

### EmailService Methods

#### `sendEmail(options: EmailOptions): Promise<boolean>`

Send a custom email.

```typescript
await emailService.sendEmail({
  to: 'user@example.com',
  subject: 'Custom Email',
  html: '<h1>Hello</h1>',
  text: 'Hello',
  replyTo: 'support@example.com', // Optional
});
```

---

#### `sendPasswordResetEmail(to: string, resetToken: string, userName: string): Promise<boolean>`

Send password reset email with token.

---

#### `sendWelcomeEmail(to: string, userName: string): Promise<boolean>`

Send welcome email to new users.

---

#### `sendPaymentConfirmation(to: string, userName: string, order: any, transaction: any): Promise<boolean>`

Send payment confirmation with order details.

---

#### `sendContactNotification(contactId, name, email, subject, message, messageId?): Promise<boolean>`

Send contact form notification to admin.

---

#### `sendContactReply(to, userName, subject, reply, replyMessageId, inReplyTo, threadId): Promise<boolean>`

Send reply to contact form submission.

---

## Resources

- **Resend Dashboard**: [resend.com/emails](https://resend.com/emails)
- **API Documentation**: [resend.com/docs](https://resend.com/docs)
- **API Keys**: [resend.com/api-keys](https://resend.com/api-keys)
- **Domain Setup**: [resend.com/domains](https://resend.com/domains)
- **Status Page**: [status.resend.com](https://status.resend.com)
- **Pricing**: [resend.com/pricing](https://resend.com/pricing)

---

## Quick Checklist

### Development Setup
- [ ] Create Resend account
- [ ] Get API key
- [ ] Add `RESEND_API_KEY` to `.env`
- [ ] Use `onboarding@resend.dev` as `EMAIL_FROM`
- [ ] Test email sending
- [ ] Check Resend dashboard for delivery

### Production Setup
- [ ] Create production API key
- [ ] Verify your domain with DNS records
- [ ] Update `EMAIL_FROM` to your domain
- [ ] Set up DMARC policy
- [ ] Configure monitoring/alerts
- [ ] Test all email templates
- [ ] Monitor analytics in Resend dashboard

---

**Need help?** Contact [Resend Support](https://resend.com/support) or check their [documentation](https://resend.com/docs).
