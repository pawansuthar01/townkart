import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, amount, reason, speed = "normal" } = body;

    // Validate required fields
    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 },
      );
    }

    // Prepare refund options
    const refundOptions: any = {
      payment_id: paymentId,
      speed: speed, // "normal" or "optimum"
    };

    // Add amount if partial refund
    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paisa
    }

    // Add notes if reason provided
    if (reason) {
      refundOptions.notes = {
        reason: reason,
      };
    }

    // Create refund
    const refund = await razorpay.payments.refund(paymentId, refundOptions);

    return NextResponse.json({
      id: refund.id,
      paymentId: refund.payment_id,
      amount: refund?.amount ?? 0 / 100, // Convert back to rupees
      currency: refund.currency,
      status: refund.status,
      speed: refund?.speed,
      reason: reason,
    });
  } catch (error: any) {
    console.error("Error processing refund:", error);

    // Handle specific Razorpay errors
    if (error.error && error.error.description) {
      return NextResponse.json(
        { error: error.error.description },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Refund processing failed" },
      { status: 500 },
    );
  }
}
