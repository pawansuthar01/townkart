# DLT SMS Templates for TownKart

## 📋 **Required DLT Templates**

Register these exact templates on your DLT platform for TownKart SMS compliance.

---

## **1. OTP Template (Most Important)**

### **Template Name:** TownKart OTP

### **Category:** OTP/Authentication

### **Content Type:** Transactional

### **Template Text:**

```
Your TownKart OTP for {purpose} is: {otp}. Valid for 10 minutes.
```

### **Variables:**

- `{purpose}`: LOGIN, REGISTER, RESET_PASSWORD
- `{otp}`: 6-digit OTP code

### **Example Messages:**

- `Your TownKart OTP for LOGIN is: 123456. Valid for 10 minutes.`
- `Your TownKart OTP for REGISTER is: 789012. Valid for 10 minutes.`

---

## **2. Order Confirmation Template**

### **Template Name:** TownKart Order Confirmation

### **Category:** Order Updates

### **Content Type:** Transactional

### **Template Text:**

```
Your order {orderId} has been placed successfully. Total: ₹{amount}. Track: {url}
```

### **Variables:**

- `{orderId}`: Order number (e.g., TK12345)
- `{amount}`: Order total amount
- `{url}`: Tracking URL

### **Example Message:**

```
Your order TK12345 has been placed successfully. Total: ₹250. Track: https://townkart.com/track/TK12345
```

---

## **3. Order Assigned Template**

### **Template Name:** TownKart Order Assigned

### **Category:** Order Updates

### **Content Type:** Transactional

### **Template Text:**

```
Your order {orderId} has been assigned to {storeName}. Estimated delivery: {time}
```

### **Variables:**

- `{orderId}`: Order number
- `{storeName}`: Store/merchant name
- `{time}`: Estimated delivery time

### **Example Message:**

```
Your order TK12345 has been assigned to Pizza Palace. Estimated delivery: 30-45 mins
```

---

## **4. Rider Assignment Template**

### **Template Name:** TownKart Rider Assigned

### **Category:** Delivery Updates

### **Content Type:** Transactional

### **Template Text:**

```
Rider {riderName} assigned to your order {orderId}. Contact: {phone}
```

### **Variables:**

- `{riderName}`: Rider's name
- `{orderId}`: Order number
- `{phone}`: Rider's contact number

### **Example Message:**

```
Rider Rajesh assigned to your order TK12345. Contact: +919876543210
```

---

## **5. Delivery Status Template**

### **Template Name:** TownKart Delivery Status

### **Category:** Delivery Updates

### **Content Type:** Transactional

### **Template Text:**

```
Your order {orderId} is {status}. {riderName} is on the way.
```

### **Variables:**

- `{orderId}`: Order number
- `{status}`: OUT_FOR_DELIVERY, ARRIVING_SOON
- `{riderName}`: Rider's name

### **Example Message:**

```
Your order TK12345 is OUT_FOR_DELIVERY. Rajesh is on the way.
```

---

## **6. Order Delivered Template**

### **Template Name:** TownKart Order Delivered

### **Category:** Delivery Updates

### **Content Type:** Transactional

### **Template Text:**

```
Your order {orderId} has been delivered successfully. Rate your experience: {url}
```

### **Variables:**

- `{orderId}`: Order number
- `{url}`: Rating/review URL

### **Example Message:**

```
Your order TK12345 has been delivered successfully. Rate your experience: https://townkart.com/rate/TK12345
```

---

## **7. Payment Success Template**

### **Template Name:** TownKart Payment Success

### **Category:** Payment Updates

### **Content Type:** Transactional

### **Template Text:**

```
Payment of ₹{amount} received for order {orderId}. Thank you for choosing TownKart!
```

### **Variables:**

- `{amount}`: Payment amount
- `{orderId}`: Order number

### **Example Message:**

```
Payment of ₹250 received for order TK12345. Thank you for choosing TownKart!
```

---

## **8. Order Cancellation Template**

### **Template Name:** TownKart Order Cancelled

### **Category:** Order Updates

### **Content Type:** Transactional

### **Template Text:**

```
Your order {orderId} has been cancelled. Reason: {reason}. Refund initiated if applicable.
```

### **Variables:**

- `{orderId}`: Order number
- `{reason}`: Cancellation reason

### **Example Message:**

```
Your order TK12345 has been cancelled. Reason: Store closed. Refund initiated if applicable.
```

---

## **9. Password Reset Template**

### **Template Name:** TownKart Password Reset

### **Category:** Account Management

### **Content Type:** Transactional

### **Template Text:**

```
Password reset OTP for your TownKart account: {otp}. Valid for 10 minutes.
```

### **Variables:**

- `{otp}`: 6-digit OTP code

### **Example Message:**

```
Password reset OTP for your TownKart account: 456789. Valid for 10 minutes.
```

---

## **10. Welcome Template**

### **Template Name:** TownKart Welcome

### **Category:** Account Management

### **Content Type:** Transactional

### **Template Text:**

```
Welcome to TownKart! Your account has been created successfully. Start ordering now!
```

### **Variables:** None

### **Example Message:**

```
Welcome to TownKart! Your account has been created successfully. Start ordering now!
```

---

## 📋 **DLT Registration Steps**

### **Step 1: Choose DLT Platform**

- Vodafone Idea: dlt.vodafoneidea.com
- Airtel: dlt.airtel.in
- Jio: dlt.jio.com
- BSNL: dlt.bsnl.co.in

### **Step 2: Register Entity**

1. Create account on chosen platform
2. Register your business entity
3. Submit required documents (PAN, GST, etc.)
4. Get Entity ID (e.g., `1101XXXX`)

### **Step 3: Register Sender ID**

1. Apply for Sender ID: `TOWNKT` (6 characters)
2. Choose Transactional SMS type
3. Wait for approval (1-7 days)

### **Step 4: Register Templates**

1. Register each template above
2. Use exact text as shown
3. Specify variable names exactly
4. Get Template IDs (e.g., `1101XXXXXX`)

### **Step 5: Update Environment**

```env
MSG91_DLT_TEMPLATE_ID="1101XXXXXX"  # OTP Template ID
```

---

## ⚠️ **Important Notes**

### **Template Rules:**

- **Exact Match Required**: SMS content must match template exactly
- **Variable Names**: Use exact variable names as defined
- **No Extra Text**: Cannot add text not in template
- **Case Sensitive**: Variable names are case-sensitive

### **Content Restrictions:**

- ✅ Transactional content only
- ❌ No promotional content
- ❌ No marketing messages
- ❌ No external links (except your domain)

### **Timeline:**

- Entity Registration: 1-2 days
- Sender ID Approval: 1-7 days
- Template Approval: 1-3 days
- Total Setup: 3-10 working days

### **Costs:**

- Entity Registration: ₹500-2000 (one-time)
- Template Registration: ₹100-500 per template
- SMS Delivery: ₹0.18-0.25 per SMS

---

## 🧪 **Testing Templates**

After registration, test with your approved Template IDs:

```bash
# Test OTP SMS
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

---

## 📞 **Support Contacts**

- **MSG91 DLT Support**: dlt.support@msg91.com
- **Vodafone DLT**: dlt.support@vodafoneidea.com
- **Airtel DLT**: dlt.support@airtel.in
- **TRAI Guidelines**: trai.gov.in

**Register these templates exactly as shown to ensure SMS delivery compliance!** ⚖️
