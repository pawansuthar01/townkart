import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = "INR", receipt, notes } = body;

    // Validate required fields
    if (!amount || !receipt) {
      return NextResponse.json(
        { error: "Amount and receipt are required" },
        { status: 400 },
      );
    }

    // Validate amount
    if (amount <= 0 || amount > 50000000) {
      // Max ₹5,00,000
      return NextResponse.json(
        { error: "Invalid amount. Must be between ₹1 and ₹5,00,000" },
        { status: 400 },
      );
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount), // Amount in paisa
      currency,
      receipt,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 },
    );
  }
}
