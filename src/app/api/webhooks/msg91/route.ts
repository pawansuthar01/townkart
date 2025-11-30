import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("MSG91 Webhook received:", body);

    // MSG91 webhook payload structure
    // {
    //   "request_id": "123456789",
    //   "sender": "TOWNKT",
    //   "source": "API",
    //   "sms": [
    //     {
    //       "message_id": "987654321",
    //       "number": "919876543210",
    //       "status": "DELIVERED", // SENT, DELIVERED, FAILED, etc.
    //       "desc": "Message delivered successfully",
    //       "timestamp": "2023-11-30 10:00:00"
    //     }
    //   ]
    // }

    const { sms } = body;

    if (!Array.isArray(sms)) {
      return NextResponse.json(
        { success: false, message: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    for (const smsItem of sms) {
      const { message_id, number, status, desc, timestamp } = smsItem;

      // Find OTP record by message_id or phone number
      // Since we store message_id in deliveryResults, let's update based on that
      // For now, we'll update based on phone number and recent OTPs

      const phoneNumber = number.replace(/^91/, ""); // Remove country code

      // Find the most recent OTP for this phone number
      const otpRecord = await prisma.oTP.findFirst({
        where: {
          phoneNumber,
          deliveryStatus: { not: "DELIVERED" }, // Only update if not already delivered
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (otpRecord) {
        // Update delivery status
        const deliveryStatus =
          status === "DELIVERED"
            ? "DELIVERED"
            : status === "FAILED"
              ? "FAILED"
              : "SENT";

        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: {
            deliveryStatus,
            deliveryWebhookData: {
              message_id,
              status,
              desc,
              timestamp,
              received_at: new Date(),
            },
          },
        });

        console.log(
          `Updated OTP ${otpRecord.id} delivery status to ${deliveryStatus}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Error processing MSG91 webhook:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // MSG91 might send GET requests for webhook verification
  return NextResponse.json({
    success: true,
    message: "Webhook endpoint active",
  });
}
