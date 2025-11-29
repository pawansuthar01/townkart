import { NextRequest, NextResponse } from "next/server";
import { codService } from "@/lib/codService";
import { getServerSession } from "next-auth";

/**
 * POST /api/riders/cash-deposit - Rider deposits cash at store
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate rider
    const session = await getServerSession();
    if (!session?.user?.id || !(session.user as any).roles?.includes("RIDER")) {
      return NextResponse.json(
        { error: "Unauthorized. Only riders can deposit cash." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { storeId, amount, riderLocation, notes } = body;

    // Validate required fields
    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 },
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid deposit amount is required" },
        { status: 400 },
      );
    }

    if (!riderLocation?.latitude || !riderLocation?.longitude) {
      return NextResponse.json(
        { error: "Rider location (latitude, longitude) is required" },
        { status: 400 },
      );
    }

    // Record cash deposit
    const result = await codService.recordCashDeposit({
      riderId: session.user.id,
      storeId,
      amount: parseFloat(amount),
      riderLocation: {
        latitude: parseFloat(riderLocation.latitude),
        longitude: parseFloat(riderLocation.longitude),
        accuracy: parseFloat(riderLocation.accuracy) || 10,
      },
      notes,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: {
          settlementId: result.settlementId,
        },
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Cash deposit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/riders/cash-deposit - Get rider cash balance and status
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate rider
    const session = await getServerSession();
    if (!session?.user?.id || !(session.user as any).roles?.includes("RIDER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get rider cash balance
    const balance = await codService.getRiderCashBalance(session.user.id);

    return NextResponse.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error("Get cash balance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
