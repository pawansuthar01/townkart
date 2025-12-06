# WhatsApp Invitation Template for TownKart

## Template Details

**Template Name:** `townkart_invitation_v2`
**Language:** English (en)
**Category:** Utility
**Template Type:** Text with Button

## Template Content

```
🏪 TownKart Team Invitation

Hello!

You've been invited to join the TownKart team as a {{body_1}}.

Your invitation expires in {{body_2}}.

Click the button below to accept your invitation and complete registration.

[Accept Invitation]
```

## Template Parameters

1. **{{body_1}}** - Role (e.g., "Rider", "Store Manager")
2. **{{body_2}}** - Expiration time (e.g., "24 hours", "2 days")
3. **{{button_1}}** - Invitation URL (dynamic URL for accepting invitation)

## Button Configuration

- **Button Type:** Quick Reply URL
- **Button Text:** "Accept Invitation"
- **URL:** Dynamic URL passed as parameter

## Technical Implementation

### MSG91 WhatsApp API Payload (New Format)

```json
{
  "channel": "whatsapp",
  "source": "YOUR_SENDER_NUMBER",
  "destination": "RECIPIENT_PHONE",
  "src": {
    "name": "TownKart",
    "number": "YOUR_SENDER_NUMBER"
  },
  "template": {
    "name": "townkart_invitation",
    "language": { "code": "en" },
    "components": [
      {
        "type": "header",
        "parameters": [{ "type": "text", "text": "TownKart Invitation" }]
      },
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Rider" },
          { "type": "text", "text": "24 hours" },
          {
            "type": "text",
            "text": "https://townkart.com/auth/invitation?token=abc123"
          }
        ]
      },
      {
        "type": "button",
        "sub_type": "url",
        "index": 0,
        "parameters": [
          {
            "type": "text",
            "text": "https://townkart.com/auth/invitation?token=abc123"
          }
        ]
      }
    ]
  }
}
```

## Environment Variables Required

```env
MSG91_WHATSAPP_AUTH_KEY=your_msg91_whatsapp_auth_key
MSG91_WHATSAPP_TEMPLATE_INVITATION_V2_NAME=townkart_invitation_v2
MSG91_WHATSAPP_NAMESPACE=0a0d82ce_9390_423d_85f0_2c79dbeb5ae7
MSG91_WHATSAPP_INTEGRATED_NUMBER=919784740736
```

## Approval Process

1. **Submit Template:** Submit this template to WhatsApp for approval through your MSG91 dashboard
2. **Wait for Approval:** WhatsApp typically approves utility templates within 24-48 hours
3. **Template ID:** Once approved, you'll receive a template ID to use in your API calls
4. **Update Code:** Add the template ID to your environment variables if required

## Fallback Implementation

If WhatsApp template is not approved, the system will use mock WhatsApp sending for development/testing:

```javascript
console.log(`[MOCK WhatsApp] Message: ${notification.message}`);
console.log(
  `[MOCK WhatsApp] Please configure MSG91 WhatsApp environment variables`
);
```

## Testing

To test the WhatsApp invitation functionality:

1. Set up MSG91 WhatsApp credentials in environment variables
2. Ensure the template is approved by WhatsApp
3. Create an invitation with WhatsApp channel selected
4. Check MSG91 dashboard for delivery status

## Alternative Templates

If the main template is rejected, here are alternative versions:

### Version 2 (Simpler)

```
You've been invited to join TownKart as a {{1}}.

Click here to accept: {{2}}

Expires in {{3}}.
```

### Version 3 (More Detailed)

```
🏪 TownKart Team Invitation

Hello!

You've been invited to join the TownKart team as a {{1}}.

Your invitation link: {{2}}

⏰ Expires in: {{3}}

Click the link above to get started!
```

## Notes

- WhatsApp Business API requires pre-approved templates for all messages
- Templates cannot contain promotional content
- URLs in templates must be whitelisted
- Template approval can take 1-2 business days
- Test templates thoroughly before submitting for approval
