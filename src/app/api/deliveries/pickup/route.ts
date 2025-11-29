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

    const { deliveryId, pickupOtp } = await request.json();

    if (!deliveryId || !pickupOtp) {
      return NextResponse.json(
        { error: "Delivery ID and pickup OTP are required" },
        { status: 400 },
      );
    }

    // Get delivery with order details
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: true,
        rider: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 },
      );
    }

    // Check if rider is assigned to this delivery
    if (delivery.riderId !== delivery.rider?.id) {
      return NextResponse.json(
        { error: "Not authorized for this delivery" },
        { status: 403 },
      );
    }

    // Verify pickup OTP
    if (delivery.pickupOtp !== pickupOtp) {
      return NextResponse.json(
        { error: "Invalid pickup OTP" },
        { status: 400 },
      );
    }

    // Update delivery status
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        deliveryStatus: "PICKED_UP",
        pickupTime: new Date(),
        pickupOtpVerified: true,
      },
      include: {
        order: {
          include: {
            customer: {
              select: { fullName: true, phoneNumber: true },
            },
            store: {
              select: { name: true, address: true },
            },
          },
        },
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        orderStatus: "EN_ROUTE",
      },
    });

    // Log the pickup event
    await prisma.deliveryLog.create({
      data: {
        deliveryId,
        eventType: "pickup_completed",
        description: `Order picked up by rider ${delivery.rider?.user?.fullName}`,
        actorId: session.user.id,
        actorType: "rider",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order picked up successfully",
      data: updatedDelivery,
    });
  } catch (error) {
    console.error("Pickup delivery error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
