import { NextRequest, NextResponse } from "next/server";
import { codService } from "@/lib/codService";
import { getServerSession } from "next-auth";

/**
 * POST /api/deliveries/[deliveryId]/cash-collect - Rider records cash collection
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { deliveryId: string } },
) {
  try {
    // Authenticate rider
    const session = await getServerSession();
    if (!session?.user?.id || !(session.user as any).roles?.includes("RIDER")) {
      return NextResponse.json(
        { error: "Unauthorized. Only riders can record cash collection." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { amount, riderLocation, customerOtp, photoProofUrl } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid cash amount is required" },
        { status: 400 },
      );
    }

    if (!riderLocation?.latitude || !riderLocation?.longitude) {
      return NextResponse.json(
        { error: "Rider location (latitude, longitude) is required" },
        { status: 400 },
      );
    }

    // Record cash collection
    const result = await codService.recordCashCollection({
      deliveryId: params.deliveryId,
      riderId: session.user.id,
      amount: parseFloat(amount),
      riderLocation: {
        latitude: parseFloat(riderLocation.latitude),
        longitude: parseFloat(riderLocation.longitude),
        accuracy: parseFloat(riderLocation.accuracy) || 10,
      },
      customerOtp,
      photoProofUrl,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          transactionId: result.transactionId,
          requiresImmediateSettlement: result.requiresImmediateSettlement,
        },
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Cash collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
