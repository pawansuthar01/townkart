# MSG91 SMS Setup Guide

## 📱 Switch to MSG91 for SMS Notifications

Your TownKart system now supports **MSG91** for SMS notifications. MSG91 is India's leading SMS service provider with reliable delivery and competitive pricing.

## 📋 Setup Steps:

### 1. Create MSG91 Account

1. Go to [msg91.com](https://msg91.com)
2. Sign up for a free account
3. Complete KYC verification for transactional SMS

### 2. Get API Key & Sender ID

1. Login to your MSG91 dashboard
2. Go to **SMS** → **API**
3. Copy your **Auth Key** (API Key)
4. Go to **Sender ID** section and create/get your sender ID (6 characters, e.g., "TOWNKT")

### 3. Update Environment Variables

Update your `.env` file:

```env
# SMS (for notifications) - Using MSG91
MSG91_API_KEY="your_msg91_auth_key_here"
MSG91_SENDER_ID="TOWNKT"
MSG91_ROUTE="4"
MSG91_WEBHOOK_URL="https://yourdomain.com/api/webhooks/msg91"
```

### 4. Configure Webhook (Optional but Recommended)

1. In MSG91 dashboard, go to **SMS** → **Webhook**
2. Set webhook URL to: `https://yourdomain.com/api/webhooks/msg91`
3. This enables delivery status tracking

## ✅ SMS & WhatsApp Features:

### **SMS Features:**

- **OTP Messages**: Registration and login verification
- **Order Notifications**: Delivery updates, payment confirmations
- **Delivery Alerts**: Rider assignments, status updates
- **Promotional SMS**: Marketing campaigns
- **Delivery Tracking**: Real-time SMS status updates

### **WhatsApp Features:**

- **OTP Messages**: WhatsApp OTP for registration/login
- **Order Updates**: WhatsApp notifications for order status
- **Delivery Alerts**: WhatsApp messages for delivery updates
- **Customer Support**: WhatsApp integration for support chats
- **Marketing Messages**: WhatsApp campaigns (with opt-in)

### **WhatsApp Setup:**

1. In MSG91 dashboard, go to **WhatsApp** → **Settings**
2. Enable WhatsApp Business API
3. **Get separate WhatsApp Auth Key** (different from SMS API key)
4. **Get WhatsApp Business Number** (your registered WhatsApp number)
5. Add to `.env`:
   ```env
   MSG91_WHATSAPP_AUTH_KEY="your_whatsapp_auth_key_here"
   MSG91_WHATSAPP_SENDER_NUMBER="9197XXXX"
   MSG91_WHATSAPP_CLIENT_ID="client-XXXXXXX"
   ```

### **Important Notes:**

- **WhatsApp Auth Key ≠ SMS API Key** - They are completely separate
- **Use WhatsApp Business Number** - Not sender ID like SMS
- **API Structure is Different** - WhatsApp uses different payload format than SMS

## 📊 SMS Templates:

- **OTP**: "Your TownKart OTP for login is: 123456. Valid for 10 minutes."
- **Order**: "Your order #12345 has been assigned to rider John. Track: townkart.com/track/12345"
- **Delivery**: "Rider John is 2km away. Call: +919876543210"
- **Payment**: "Payment of ₹250 received for order #12345"

## 🔧 Technical Details:

- **Route 4**: Transactional SMS (higher priority, better delivery)
- **DND Compliance**: Automatic DND filtering
- **Delivery Reports**: Webhook integration for status tracking
- **Unicode Support**: Multi-language SMS support

## 💰 Pricing:

- **Transactional SMS**: ~₹0.18-0.25 per SMS
- **Promotional SMS**: ~₹0.10-0.15 per SMS
- **Free Credits**: Available for testing

## 🧪 Testing:

After setup, test SMS functionality:

1. Try user registration (OTP SMS)
2. Place a test order (order notifications)
3. Check MSG91 dashboard for delivery reports

## ⚠️ **CRITICAL: DLT Compliance Required**

**Before using MSG91 for production SMS, you MUST complete DLT registration.**

### **DLT Setup Steps:**

1. **Register Entity** on DLT platform (vodafoneidea.com, airtel.in, etc.)
2. **Get Sender ID Approved** (6 characters)
3. **Register SMS Templates** and get Template IDs
4. **Add Template IDs** to your `.env` file

### **DLT Environment Variables:**

```env
MSG91_DLT_TEMPLATE_ID="1101XXXXXX"  # Your approved template ID
```

### **Without DLT Template ID, SMS will fail!**

📖 **See `DLT_SETUP.md`** for complete DLT registration guide.

## 📞 Support:

- **MSG91 Support**: support@msg91.com
- **DLT Support**: Contact your telecom operator's DLT portal
- **Documentation**: [docs.msg91.com](https://docs.msg91.com)
- **API Reference**: Comprehensive REST API docs

## 🔒 Security:

- **API Key Protection**: Never expose in client-side code
- **Rate Limiting**: Built-in rate limiting protection
- **IP Whitelisting**: Optional IP restrictions
- **Encryption**: All communications are encrypted

Your TownKart system now has professional SMS capabilities with MSG91! 📱✨
