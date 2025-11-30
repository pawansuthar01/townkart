#!/usr/bin/env node

/**
 * Test script for MSG91 SMS with DLT compliance
 * Run with: node test-sms.js
 */

require("dotenv").config();

async function testSMS() {
  const apiKey = process.env.MSG91_API_KEY;
  const senderId = process.env.MSG91_SENDER_ID || "TOWNKT";
  const route = process.env.MSG91_ROUTE || "4";
  const dltTemplateId = process.env.MSG91_DLT_TEMPLATE_ID;

  console.log("🧪 Testing MSG91 SMS Configuration...\n");

  // Check environment variables
  console.log("📋 Configuration Check:");
  console.log(`API Key: ${apiKey ? "✅ Set" : "❌ Missing"}`);
  console.log(`Sender ID: ${senderId}`);
  console.log(`Route: ${route}`);
  console.log(`DLT Template ID: ${dltTemplateId ? "✅ Set" : "❌ Missing"}\n`);

  if (!apiKey) {
    console.log(
      "❌ MSG91_API_KEY is required. Please set it in your .env file."
    );
    process.exit(1);
  }

  if (!dltTemplateId) {
    console.log(
      "⚠️  MSG91_DLT_TEMPLATE_ID is missing. SMS may fail without DLT compliance."
    );
    console.log("   See DLT_SETUP.md for registration instructions.\n");
  }

  // Test phone number (replace with your test number)
  const testPhone = process.argv[2] || "9999999999"; // Pass phone number as argument
  const testMessage =
    "Your TownKart OTP for LOGIN is: 123456. Valid for 10 minutes.";

  console.log("📱 Test SMS Details:");
  console.log(`To: +91${testPhone}`);
  console.log(`Message: ${testMessage}`);
  console.log(`Sender: ${senderId}`);
  console.log(`DLT Template ID: ${dltTemplateId || "Not set"}\n`);

  try {
    // Prepare SMS data
    const smsData = {
      sender: senderId,
      route: route,
      country: "91",
      sms: [
        {
          message: testMessage,
          to: [testPhone],
        },
      ],
    };

    // Add DLT template ID if available
    if (dltTemplateId) {
      smsData.sms[0].DLT_TE_ID = dltTemplateId;
    }

    console.log("🚀 Sending test SMS...");

    const response = await fetch("https://api.msg91.com/api/v2/sendsms", {
      method: "POST",
      headers: {
        authkey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smsData),
    });

    const result = await response.json();

    console.log("\n📨 MSG91 Response:");
    console.log(JSON.stringify(result, null, 2));

    if (response.ok && result.type === "success") {
      console.log("\n✅ SMS sent successfully!");
      console.log(`Request ID: ${result.request_id || result.message_id}`);
      console.log("Check your phone for the test message.");
    } else {
      console.log("\n❌ SMS sending failed!");
      console.log(`Error: ${result.message || "Unknown error"}`);

      if (result.message?.includes("DLT")) {
        console.log("\n🔧 DLT Compliance Issue:");
        console.log("- Register your entity on DLT platform");
        console.log("- Get sender ID approved");
        console.log("- Register SMS template and get Template ID");
        console.log("- Add MSG91_DLT_TEMPLATE_ID to .env file");
        console.log("\n📖 See DLT_SETUP.md for detailed instructions.");
      }
    }
  } catch (error) {
    console.log("\n❌ Network error:");
    console.log(error.message);
  }
}

// Run the test
testSMS().catch(console.error);

// Usage instructions
if (process.argv.length === 2) {
  console.log("\n💡 Usage: node test-sms.js [phone_number]");
  console.log("Example: node test-sms.js 9876543210");
  console.log("(If no phone number provided, uses 9999999999 for testing)");
}
