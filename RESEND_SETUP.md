# Resend Email Setup Guide

## 🚀 Switch from Gmail SMTP to Resend

Your TownKart system has been updated to use **Resend** instead of Gmail SMTP for better email deliverability and easier setup.

## 📋 Setup Steps:

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email

### 2. Get API Key

1. Go to your Resend dashboard
2. Navigate to API Keys section
3. Create a new API key
4. Copy the API key

### 3. Update Environment Variables

Update your `.env` file:

```env
# Replace Gmail SMTP with Resend
RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
EMAIL_FROM="noreply@townkart.com"
```

### 4. Verify Domain (Optional but Recommended)

1. In Resend dashboard, go to Domains
2. Add your domain (townkart.com)
3. Follow DNS verification steps
4. Update EMAIL_FROM to use your verified domain

## ✅ Benefits of Resend:

- **Better Deliverability**: Higher inbox placement rates
- **Modern API**: Simple REST API instead of SMTP
- **Analytics**: Track email opens, clicks, and bounces
- **Templates**: Built-in email templates
- **Free Tier**: 3,000 emails/month free

## 🔧 Email Features:

- **Professional Templates**: Beautiful HTML emails with TownKart branding
- **Invitation Emails**: Automated invitation system with action buttons
- **Payment Notifications**: Order confirmations and status updates
- **Error Handling**: Automatic retry and error logging

## 🧪 Testing:

After setup, test the invitation system:

1. Admin sends invitation to a rider/store
2. Check Resend dashboard for email delivery
3. Verify email formatting and links

## 📞 Support:

If you need help with Resend setup, check their documentation at [resend.com/docs](https://resend.com/docs)
