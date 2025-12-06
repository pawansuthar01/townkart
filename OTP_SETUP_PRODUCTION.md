# OTP Setup Guide for Production

This guide will help you set up OTP (One-Time Password) services for SMS, Email, and WhatsApp in your TownKart application.

## 📱 SMS OTP Setup (MSG91)

### 1. Create MSG91 Account

1. Go to [https://msg91.com](https://msg91.com)
2. Sign up for an account
3. Complete KYC verification for Indian SMS compliance

### 2. Get API Credentials

1. Login to MSG91 dashboard
2. Go to "API" section
3. Copy your API Key
4. Note your Sender ID (default: TOWNKT)

### 3. Configure DLT Template (Required for India)

1. Go to "DLT" section in MSG91 dashboard
2. Register your DLT template with this content:
   ```
   Your TownKart OTP for {purpose} is: {otp}. Valid for 10 minutes.
   ```
3. Get your DLT Template ID
4. Set route to "4" (Transactional)

### 4. Environment Variables

```bash
MSG91_API_KEY=your_msg91_api_key_here
MSG91_SENDER_ID=TOWNKT
MSG91_ROUTE=4
MSG91_DLT_TEMPLATE_ID=your_dlt_template_id
```

## 📧 Email OTP Setup (Resend)

### 1. Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up and verify your email
3. Add your domain (townkart.com)

### 2. Verify Domain

1. In Resend dashboard, go to "Domains"
2. Add your domain (townkart.com)
3. Add the DNS records to your domain provider
4. Wait for domain verification (can take 24-48 hours)

### 3. Get API Key

1. Go to "API Keys" section
2. Create a new API key
3. Copy the API key

### 4. Environment Variables

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=support@townkart.com
```

## 💬 WhatsApp OTP Setup (MSG91)

### 1. Enable WhatsApp in MSG91

1. In MSG91 dashboard, go to "WhatsApp" section
2. Apply for WhatsApp Business API
3. Complete Meta/Facebook verification process
4. Get WhatsApp credentials

### 2. Create WhatsApp Template

1. In MSG91 WhatsApp section, create a template:
   - Name: `otp_template`
   - Content: `Your TownKart OTP for {{1}} is: {{2}}. Valid for 10 minutes.`
   - Variables: `{{1}}` = purpose, `{{2}}` = OTP
2. Add a button with URL action pointing to your app

### 3. Get WhatsApp Credentials

1. Copy Auth Key
2. Copy Sender Number
3. Copy Template Name
4. Copy Namespace

### 4. Environment Variables

```bash
MSG91_WHATSAPP_AUTH_KEY=your_whatsapp_auth_key
MSG91_WHATSAPP_SENDER_NUMBER=918xxxxxxxxx
MSG91_WHATSAPP_TEMPLATE_NAME=otp_template
MSG91_WHATSAPP_NAMESPACE=your_namespace_id
MSG91_WHATSAPP_BUTTON_URL=https://townkart.com
```

## 🔧 Complete Environment Configuration

Add all these variables to your `.env` file:

```bash
# SMS (MSG91)
MSG91_API_KEY=your_msg91_api_key_here
MSG91_SENDER_ID=TOWNKT
MSG91_ROUTE=4
MSG91_DLT_TEMPLATE_ID=your_dlt_template_id

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=support@townkart.com

# WhatsApp (MSG91)
MSG91_WHATSAPP_AUTH_KEY=your_whatsapp_auth_key
MSG91_WHATSAPP_SENDER_NUMBER=918xxxxxxxxx
MSG91_WHATSAPP_TEMPLATE_NAME=otp_template
MSG91_WHATSAPP_NAMESPACE=your_namespace_id
MSG91_WHATSAPP_BUTTON_URL=https://townkart.com

# OTP Settings (Optional - defaults will be used)
OTP_DELIVERY_METHOD=both
OTP_EMAIL_ENABLED=true
OTP_SMS_ENABLED=true
OTP_WHATSAPP_ENABLED=true
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3
OTP_COOLDOWN_MINUTES=5
OTP_RETRY_ATTEMPTS=2
OTP_ENABLE_FALLBACK=true
```

## 🧪 Testing OTP Services

### Test SMS

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"action": "send", "phoneNumber": "+919876543210", "purpose": "LOGIN"}'
```

### Test Email

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"action": "send", "phoneNumber": "+919876543210", "purpose": "REGISTER"}'
```

### Test Full Registration Flow

1. Try registering a new user
2. Check if OTP is received on phone/email
3. Verify OTP to complete registration

## 📊 Monitoring OTP Delivery

### Check OTP Metrics

```bash
curl http://localhost:3000/api/admin/otp-metrics
```

### View OTP Logs

Check your database for OTP records:

```sql
SELECT * FROM "OTP" WHERE "createdAt" > NOW() - INTERVAL '1 hour' ORDER BY "createdAt" DESC;
```

## 🚨 Troubleshooting

### SMS Not Working

1. Check MSG91 API key is correct
2. Verify DLT template is approved
3. Check phone number format (+91XXXXXXXXXX)
4. Check MSG91 dashboard for delivery reports

### Email Not Working

1. Verify domain is properly configured in Resend
2. Check DNS records are added
3. Wait for domain verification (24-48 hours)
4. Check spam folder

### WhatsApp Not Working

1. Ensure WhatsApp Business API is approved by Meta
2. Verify template is approved
3. Check WhatsApp credentials
4. Test with WhatsApp-enabled phone number

## 💰 Pricing Information

- **MSG91 SMS**: ~₹0.25-₹1 per SMS (varies by volume)
- **Resend Email**: Free for 3,000 emails/month, then $0.0002 per email
- **MSG91 WhatsApp**: ~₹0.50-₹2 per message

## 🔒 Security Best Practices

1. **Rate Limiting**: Already implemented (3 OTPs per hour per number)
2. **OTP Expiry**: 10 minutes default
3. **Max Attempts**: 3 attempts per OTP
4. **Cooldown Period**: 5 minutes between requests
5. **Secure Storage**: OTPs are hashed in database
6. **Audit Logging**: All OTP attempts are logged

## 📞 Support

- MSG91 Support: [https://msg91.com/support](https://msg91.com/support)
- Resend Support: [https://resend.com/docs](https://resend.com/docs)
- TownKart Technical Support: Check application logs for detailed error messages

---

**Note**: Without proper API keys configured, the system will use mock OTP delivery (visible in console logs) for development purposes.
