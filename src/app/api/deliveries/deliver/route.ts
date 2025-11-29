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

    const { deliveryId, deliveryOtp, proofPhotoUrl, customerFeedback } =
      await request.json();

    if (!deliveryId || !deliveryOtp) {
      return NextResponse.json(
        { error: "Delivery ID and delivery OTP are required" },
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

    // Verify delivery OTP
    if (delivery.deliveryOtp !== deliveryOtp) {
      return NextResponse.json(
        { error: "Invalid delivery OTP" },
        { status: 400 },
      );
    }

    // Update delivery status
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        deliveryStatus: "DELIVERED",
        deliveryTime: new Date(),
        deliveryOtpVerified: true,
        proofPhotoUrl,
        customerFeedback,
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
        orderStatus: "DELIVERED",
        deliveredAt: new Date(),
      },
    });

    // Create earnings record for this delivery
    if (delivery.deliveryFee > 0) {
      await prisma.riderEarnings.create({
        data: {
          riderId: delivery.riderId!,
          deliveryId,
          baseEarnings: delivery.deliveryFee,
          bonusEarnings: 0,
          penaltyAmount: 0,
          totalEarnings: delivery.deliveryFee,
          earningsDate: new Date(),
          isPaid: false,
        },
      });

      // Update rider's total earnings
      await prisma.riderProfile.update({
        where: { id: delivery.riderId! },
        data: {
          totalEarnings: {
            increment: delivery.deliveryFee,
          },
          totalDeliveries: {
            increment: 1,
          },
        },
      });
    }

    // Log the delivery event
    await prisma.deliveryLog.create({
      data: {
        deliveryId,
        eventType: "delivery_completed",
        description: `Order delivered by rider ${delivery.rider?.user?.fullName}`,
        actorId: session.user.id,
        actorType: "rider",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order delivered successfully",
      data: updatedDelivery,
    });
  } catch (error) {
    console.error("Deliver order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
