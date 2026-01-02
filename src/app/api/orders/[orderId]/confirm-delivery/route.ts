import { NextRequest, NextResponse } from "next/server";
import { deliveryService } from "@/lib/deliveryService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/orders/[orderId]/confirm-delivery - Customer confirms delivery receipt
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Authenticate customer
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      !(session.user as any).roles?.includes("CUSTOMER")
    ) {
      return NextResponse.json(
        { error: "Unauthorized. Only customers can confirm delivery receipt." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { confirmed, feedback } = body;

    // Validate required fields
    if (typeof confirmed !== "boolean") {
      return NextResponse.json(
        { error: "Confirmation status (true/false) is required" },
        { status: 400 }
      );
    }

    // Process customer confirmation
    const result = await deliveryService.processCustomerConfirmation({
      orderId: params.orderId,
      customerId: session.user.id,
      confirmed,
      feedback: feedback || undefined,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Customer delivery confirmation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
