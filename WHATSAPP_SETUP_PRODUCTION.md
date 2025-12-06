# 📱 Production WhatsApp Setup Guide

## Current Issue

WhatsApp notifications are not visible to recipients. This is likely due to template configuration issues in MSG91.

## ✅ Production WhatsApp Setup Steps

### 1. **MSG91 WhatsApp Business API Setup**

```bash
# Make sure you have these environment variables configured:
MSG91_WHATSAPP_AUTH_KEY="your_whatsapp_auth_key"
MSG91_WHATSAPP_NAMESPACE="your_namespace_id"
MSG91_WHATSAPP_INTEGRATED_NUMBER="919xxxxxxxxx"
```

### 2. **WhatsApp Template Configuration**

You need to create these templates in your MSG91 WhatsApp Business dashboard:

#### **Template 1: Invitation Template (`townkart_invitation_v2`)**

```
Name: townkart_invitation_v2
Category: Utility
Language: English

Body:
You've been invited to join TownKart as a {{1}}.

This invitation expires on {{2}}.

Button: Accept Invitation (URL: {{3}})
```

#### **Template 2: Order Update Template (`townkart_order_update`)**

```
Name: townkart_order_update
Category: Utility
Language: English

Body:
{{1}}

{{2}}
```

#### **Template 3: Delivery Template (`townkart_delivery`)**

```
Name: townkart_delivery
Category: Utility
Language: English

Body:
Order {{1}}

{{2}}
```

#### **Template 4: Payment Template (`townkart_payment`)**

```
Name: townkart_payment
Category: Utility
Language: English

Body:
Payment {{1}}

{{2}}
```

#### **Template 5: General Template (`townkart_general`)**

```
Name: townkart_general
Category: Utility
Language: English

Body:
{{1}}
```

### 3. **Template Approval Process**

```bash
1. Submit templates to WhatsApp for approval
2. Wait 24-48 hours for approval
3. Templates must follow WhatsApp's policies
4. Use clear, non-promotional language
```

### 4. **Testing WhatsApp Notifications**

```bash
# After template approval, test by creating an invitation
# Check console logs for detailed debugging info
```

## 🔍 Troubleshooting WhatsApp Issues

### **Common Issues & Solutions**

#### **Issue: Template not found**

```
Error: Template townkart_invitation_v2 not found
```

**Solution:**

- Check if template name matches exactly in MSG91 dashboard
- Verify template is approved by WhatsApp
- Check namespace configuration

#### **Issue: Invalid phone number**

```
Error: Invalid phone number format
```

**Solution:**

- Phone must be in format: +91XXXXXXXXXX
- Remove any spaces or special characters
- Ensure country code is included

#### **Issue: API Authentication failed**

```
Error: Invalid auth key
```

**Solution:**

- Verify MSG91_WHATSAPP_AUTH_KEY in .env
- Check if WhatsApp Business API is enabled in MSG91

#### **Issue: Namespace mismatch**

```
Error: Invalid namespace
```

**Solution:**

- Verify MSG91_WHATSAPP_NAMESPACE matches your MSG91 account
- Default: "0a0d82ce_9390_423d_85f0_2c79dbeb5ae7"

### **Debugging Steps**

#### **1. Check Console Logs**

```bash
# Look for these log messages:
📱 Sending WhatsApp: [title]
📱 Notification type: invitation
📱 Using template: townkart_invitation_v2
📱 Using namespace: [namespace]
📱 Using integrated number: [number]
```

#### **2. Check Admin Dashboard**

```bash
# Visit /admin/notification-logs
# Filter by channel: whatsapp
# Check error messages for failed deliveries
```

#### **3. Test API Directly**

```bash
# Use MSG91 API documentation to test templates directly
# Verify template names and parameters
```

## 📊 Monitoring WhatsApp Delivery

### **Success Indicators**

```
✅ WhatsApp message sent successfully via MSG91: [requestId]
```

### **Failure Indicators**

```
❌ Failed to send WhatsApp message: [error details]
```

### **Database Queries**

```sql
-- Check WhatsApp delivery success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM notification_logs
WHERE channel = 'whatsapp'
GROUP BY status;

-- Check recent WhatsApp failures
SELECT * FROM notification_logs
WHERE channel = 'whatsapp'
AND status = 'failed'
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## 🚀 Production Checklist

- [ ] MSG91 WhatsApp Business API account active
- [ ] All 5 templates created and approved by WhatsApp
- [ ] Environment variables configured correctly
- [ ] Test notifications working
- [ ] Admin dashboard shows successful deliveries
- [ ] Error handling working for failed deliveries

## 💡 Development Mode

For development without WhatsApp approval:

```bash
# The system will show mock messages in console:
[MOCK WhatsApp] Message: [message content]
[MOCK WhatsApp] Please configure MSG91_WHATSAPP_AUTH_KEY
```

## 📞 Support

If WhatsApp notifications still don't work after following this guide:

1. **Check MSG91 Dashboard**: Verify templates are approved
2. **Contact MSG91 Support**: For API-related issues
3. **Check WhatsApp Policies**: Ensure templates follow guidelines
4. **Verify Phone Numbers**: Test with different phone numbers

The enhanced logging will now show exactly what's happening with WhatsApp notifications!
