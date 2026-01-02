import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Generate OTP for pickup or delivery
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { deliveryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deliveryId = params.deliveryId;
    const { type } = await request.json(); // 'pickup' or 'delivery'

    if (!type || !["pickup", "delivery"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid OTP type. Must be 'pickup' or 'delivery'" },
        { status: 400 }
      );
    }

    // Get delivery and verify rider access
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        riderId: true,
        order: {
          select: {
            customer: {
              select: {
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    if (delivery.riderId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to this delivery" },
        { status: 403 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();

    // Update delivery with new OTP
    const updateData: any = {};
    if (type === "pickup") {
      updateData.pickupOtp = otp;
      updateData.pickupOtpVerified = false;
    } else {
      updateData.deliveryOtp = otp;
      updateData.deliveryOtpVerified = false;
    }

    await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // TODO: Send OTP via SMS to customer
    console.log(
      `Sending ${type} OTP ${otp} for delivery ${deliveryId} to customer phone number ${delivery.order.customer.phoneNumber}`
    );
    // await sendSMS(delivery.order.customer.phoneNumber, `Your ${type} OTP is: ${otp}`);

    // TODO: Create delivery log
    // await prisma.deliveryLog.create({ ... });

    return NextResponse.json({
      success: true,
      message: `OTP sent for ${type}`,
      data: {
        deliveryId,
        type,
        otpSent: true, // In production, don't return the OTP
      },
    });
  } catch (error: any) {
    console.error("Generate OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { deliveryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deliveryId = params.deliveryId;
    const { otp, type } = await request.json(); // 'pickup' or 'delivery'

    if (!otp || !type || !["pickup", "delivery"].includes(type)) {
      return NextResponse.json(
        { error: "OTP and type are required" },
        { status: 400 }
      );
    }

    // Get delivery and verify rider access
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { rider: true, order: true },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 }
      );
    }

    if (delivery.riderId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized access to this delivery" },
        { status: 403 }
      );
    }

    // Verify OTP
    let isValid = false;
    const updateData: any = {};

    if (type === "pickup") {
      isValid = delivery.pickupOtp === otp;
      if (isValid) {
        updateData.pickupOtpVerified = true;
        updateData.pickupTime = new Date();
        updateData.deliveryStatus = "PICKED_UP";
      }
    } else {
      isValid = delivery.deliveryOtp === otp;
      if (isValid) {
        updateData.deliveryOtpVerified = true;
        updateData.deliveryTime = new Date();
        updateData.deliveryStatus = "DELIVERED";
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Update delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        order: true,
        rider: true,
      },
    });

    // Update order status if delivered
    if (type === "delivery" && isValid) {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: {
          orderStatus: "DELIVERED",
          deliveredAt: new Date(),
        },
      });

      // TODO: Process earnings
      // await processDeliveryEarnings(deliveryId);
    }

    // TODO: Create delivery log
    // await prisma.deliveryLog.create({ ... });

    // TODO: Send notification to customer
    // await sendNotification(delivery.order.customerId, ...);

    return NextResponse.json({
      success: true,
      message: `${type} OTP verified successfully`,
      data: {
        deliveryId,
        type,
        verified: true,
        deliveryStatus: updatedDelivery.deliveryStatus,
      },
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
