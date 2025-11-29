import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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
      select: {
        id: true,
        isAvailable: true,
        maxDailyDeliveries: true,
      },
    });

    if (!rider || !rider.isAvailable) {
      return NextResponse.json(
        { error: "Rider not available" },
        { status: 400 },
      );
    }

    // Get delivery
    const delivery = await prisma.delivery.findFirst({
      where: {
        orderId,
        riderId: null, // Not yet assigned
        deliveryStatus: "ASSIGNED",
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not available" },
        { status: 404 },
      );
    }

    // Assign delivery to rider
    const { assignDeliveryToRider } = await import("@/lib/deliveryAssignment");
    const success = await assignDeliveryToRider(delivery.id, rider.id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to assign delivery" },
        { status: 500 },
      );
    }

    // Update order status to rider assigned
    await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: "RIDER_ASSIGNED", // Rider assigned to delivery
      },
    });

    return NextResponse.json({
      success: true,
      message: "Delivery accepted successfully",
    });
  } catch (error) {
    console.error("Accept delivery error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
