import { NextRequest, NextResponse } from "next/server";
import { codService } from "@/lib/codService";
import { getServerSession } from "next-auth";

/**
 * POST /api/admin/cash-settlements - Process cash settlement (admin/store manager)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin or store manager
    const session = await getServerSession();
    if (
      !session?.user?.id ||
      (!(session.user as any).roles?.includes("ADMIN") &&
        !(session.user as any).roles?.includes("STORE_MANAGER"))
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Only admins or store managers can process settlements.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { riderId, storeId, settlementDate, notes } = body;

    // Validate required fields
    if (!riderId || !storeId) {
      return NextResponse.json(
        { error: "Rider ID and Store ID are required" },
        { status: 400 },
      );
    }

    // Process settlement
    const result = await codService.processCashSettlement({
      riderId,
      storeId,
      settlementDate: settlementDate ? new Date(settlementDate) : new Date(),
      notes,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.settlementDetails,
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Cash settlement error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/cash-settlements - Get cash settlements (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const session = await getServerSession();
    if (!session?.user?.id || !(session.user as any).roles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can view all settlements." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const riderId = searchParams.get("riderId");
    const storeId = searchParams.get("storeId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {};
    if (riderId) where.riderId = riderId;
    if (storeId) where.storeId = storeId;
    if (status) where.status = status;

    // This would need to be implemented in the service
    // For now, return placeholder
    return NextResponse.json({
      success: true,
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    });
  } catch (error) {
    console.error("Get settlements error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
