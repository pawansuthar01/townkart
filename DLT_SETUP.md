# DLT Compliance Setup Guide for Indian SMS

## ⚠️ **CRITICAL: DLT Compliance Required**

In India, **DLT (Distributed Ledger Technology) compliance is mandatory** for sending transactional SMS. Without proper DLT registration, SMS will fail with errors like:

- "DLT Template Id missing OR API SMS content do not match the content added on Template"
- "DLT Template id not found"

## 📋 **DLT Registration Process**

### **Step 1: Choose DLT Platform**

Select one of the authorized DLT platforms:

- **Vodafone Idea DLT**: dlt.vodafoneidea.com
- **Airtel DLT**: dlt.airtel.in
- **Jio DLT**: dlt.jio.com
- **BSNL DLT**: dlt.bsnl.co.in

### **Step 2: Register Your Entity**

1. **Create Account** on chosen DLT platform
2. **Register Entity** (Your company/business)
3. **Submit Documents**:
   - PAN Card
   - GST Certificate
   - Business registration documents
   - Authorized signatory details
4. **Get Entity ID** (e.g., `1101XXXX`)

### **Step 3: Register Sender ID**

1. **Apply for Sender ID** (6 characters, e.g., `TOWNKT`)
2. **Choose SMS Type**: Transactional
3. **Submit Header Registration**
4. **Get Approval** (takes 1-7 days)

### **Step 4: Register SMS Templates**

Register each SMS template you want to use:

#### **OTP Template:**

```
Template: "Your TownKart OTP for {purpose} is: {otp}. Valid for 10 minutes."
Variables: {purpose}, {otp}
Category: OTP/Authentication
```

#### **Order Notification Template:**

```
Template: "Your order {orderId} status: {status}. Track: {url}"
Variables: {orderId}, {status}, {url}
Category: Order Updates
```

#### **Delivery Template:**

```
Template: "Rider {riderName} assigned to order {orderId}. Contact: {phone}"
Variables: {riderName}, {orderId}, {phone}
Category: Delivery Updates
```

### **Step 5: Get Template IDs**

After approval, you'll get **Template IDs** like:

- `1101XXXXXX` (OTP Template)
- `1101YYYYYY` (Order Template)
- `1101ZZZZZZ` (Delivery Template)

## 🔧 **Update Environment Variables**

Add DLT Template IDs to your `.env`:

```env
# DLT Compliance (Required for Indian SMS)
MSG91_DLT_TEMPLATE_ID="1101XXXXXX"  # OTP Template ID
MSG91_DLT_ORDER_TEMPLATE_ID="1101YYYYYY"  # Order notifications
MSG91_DLT_DELIVERY_TEMPLATE_ID="1101ZZZZZZ"  # Delivery updates
```

## 📱 **SMS Template Management**

### **Current OTP Template:**

```
"Your TownKart OTP for {purpose} is: {otp}. Valid for 10 minutes."
```

### **Supported Purposes:**

- `LOGIN`
- `REGISTER`
- `RESET_PASSWORD`
- `PHONE_VERIFICATION`

### **Template Variables:**

- `{purpose}`: LOGIN, REGISTER, etc.
- `{otp}`: 6-digit OTP code

## 🧪 **Testing DLT Compliance**

### **Test SMS Sending:**

```bash
# Test with DLT Template ID
curl -X POST "https://api.msg91.com/api/v2/sendsms" \
  -H "authkey: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "TOWNKT",
    "route": "4",
    "country": "91",
    "sms": [{
      "message": "Your TownKart OTP for LOGIN is: 123456. Valid for 10 minutes.",
      "to": ["9999999999"],
      "DLT_TE_ID": "1101XXXXXX"
    }]
  }'
```

### **Check Response:**

```json
{
  "message": "SMS sent successfully",
  "type": "success",
  "request_id": "123456789"
}
```

## ⚡ **Quick Setup for Development**

For development/testing, you can:

1. **Use MSG91 Test Account** (limited SMS)
2. **Register Basic Templates** first
3. **Start with OTP Template** (most critical)
4. **Add other templates** gradually

## 📞 **DLT Support Contacts**

- **MSG91 Support**: support@msg91.com
- **Vodafone DLT**: dlt.support@vodafoneidea.com
- **Airtel DLT**: dlt.support@airtel.in
- **TRAI Guidelines**: trai.gov.in

## ⏰ **Timeline**

- **Entity Registration**: 1-2 days
- **Sender ID Approval**: 1-7 days
- **Template Approval**: 1-3 days
- **Total Setup Time**: 3-10 working days

## 💰 **Costs**

- **DLT Registration**: ₹500-2000 (one-time)
- **Template Registration**: ₹100-500 per template
- **SMS Costs**: ₹0.18-0.25 per SMS (transactional)

## 🚨 **Important Notes**

1. **Content Must Match Exactly**: SMS content must match registered template
2. **Variable Replacement**: Use exact variable names as registered
3. **No Promotional Content**: Transactional SMS only
4. **Regular Updates**: Update templates when content changes
5. **Compliance Monitoring**: TRAI monitors DLT compliance

## ✅ **Verification Checklist**

- [ ] Entity registered on DLT platform
- [ ] Sender ID approved
- [ ] OTP template registered and approved
- [ ] Template ID added to `.env`
- [ ] Test SMS sent successfully
- [ ] Webhook configured for delivery reports

## 🔄 **Next Steps**

1. **Register on DLT Platform** immediately
2. **Get OTP Template Approved** first
3. **Update Environment Variables**
4. **Test SMS Functionality**
5. **Register Additional Templates**

**Without DLT compliance, SMS will not work in production!** ⚠️
