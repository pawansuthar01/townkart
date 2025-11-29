import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Get rider profile
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!rider) {
      return NextResponse.json(
        { error: "Rider profile not found" },
        { status: 404 },
      );
    }

    // Check if delivery offer exists and is still available
    const delivery = await prisma.delivery.findFirst({
      where: {
        orderId,
        riderId: null, // Not yet assigned
        deliveryStatus: "ASSIGNED",
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery offer not available" },
        { status: 404 },
      );
    }

    // Log the rejection (optional - for analytics)
    console.log(
      `Rider ${rider.id} rejected delivery offer for order ${orderId}`,
    );

    // No database changes needed for rejection - just return success
    return NextResponse.json({
      success: true,
      message: "Delivery offer rejected",
    });
  } catch (error) {
    console.error("Reject delivery error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
