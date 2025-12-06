# 📧 Production Email Setup Guide

## Current Issue

The system is correctly detecting email failures but the townkart.com domain is not verified in Resend, causing 403 errors.

## ✅ Production Email Setup Steps

### 1. **Sign up for Resend** (if not done)

```bash
# Visit: https://resend.com
# Create account and get API key
```

### 2. **Configure Environment Variables**

```env
# .env file
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@townkart.com"
RESEND_FROM_NAME="TownKart"
```

### 3. **Domain Verification in Resend**

```bash
# Step 1: Go to https://resend.com/domains
# Step 2: Click "Add Domain"
# Step 3: Enter "townkart.com"
# Step 4: Add the DNS records to your domain registrar
# Step 5: Wait for verification (can take 5-30 minutes)
```

### 4. **Alternative: Use Verified Domain for Development**

```env
# For development/testing, use a verified domain
RESEND_FROM_EMAIL="noreply@your-verified-domain.com"
RESEND_FROM_NAME="TownKart Dev"
```

### 5. **Test Email Sending**

```bash
# After setup, test by creating an invitation
# Check logs for success confirmation
```

## 🔍 Troubleshooting

### Error: "Domain not verified"

```
❌ DOMAIN VERIFICATION REQUIRED:
❌ The sending domain is not verified in Resend.
❌ To fix this:
❌ 1. Go to https://resend.com/domains
❌ 2. Add and verify your domain (townkart.com)
❌ 3. Or use a verified domain in RESEND_FROM_EMAIL
❌ 4. For development, use: noreply@your-verified-domain.com
```

### Error: "Invalid API key"

```
❌ INVALID API KEY:
❌ Check your RESEND_API_KEY in .env file
```

### Success Message

```
✅ Email sent successfully: {data}
```

## 📊 Monitoring Email Delivery

### Admin Dashboard

- Visit `/admin/notification-logs`
- Filter by channel: "email"
- Check status: "sent" or "failed"
- View error messages for failed deliveries

### Database Queries

```sql
-- Check email delivery success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM notification_logs
WHERE channel = 'email'
GROUP BY status;

-- Check recent email failures
SELECT * FROM notification_logs
WHERE channel = 'email'
AND status = 'failed'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## 🚀 Production Checklist

- [ ] Resend account created
- [ ] API key configured in `.env`
- [ ] Domain verified in Resend dashboard
- [ ] DNS records added to domain registrar
- [ ] Test email sent successfully
- [ ] Admin dashboard shows successful deliveries
- [ ] Error handling working correctly

## 💡 Development Mode

For development without domain verification:

```env
# Use any verified domain you own
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_FROM_NAME="TownKart Dev"
```

The system will now properly log failures and provide clear setup instructions!
