import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature } = body;

    // Validate required fields
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Order ID, Payment ID, and signature are required" },
        { status: 400 },
      );
    }

    // Verify signature
    const sign = orderId + "|" + paymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest("hex");

    const verified = expectedSign === signature;

    return NextResponse.json({
      verified,
      orderId,
      paymentId,
      signature,
    });
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 },
    );
  }
}
