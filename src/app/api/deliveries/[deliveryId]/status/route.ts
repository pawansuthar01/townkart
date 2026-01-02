import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, DeliveryStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/store/slices/notificationSlice";

// Valid status transitions
const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [], // Final state
  CANCELLED: [], // Final state
};

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
    const { status, notes, location } = await request.json();

    if (!status || !Object.values(DeliveryStatus).includes(status)) {
      return NextResponse.json(
        { error: "Invalid delivery status" },
        { status: 400 }
      );
    }

    // Get delivery with rider info
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        rider: true,
        order: {
          include: {
            customer: true,
            store: true,
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

    // Check permissions: rider can update their own deliveries, admin can update any
    const isRider = delivery.riderId === session.user.id;
    const isAdmin = session.user.roles?.includes("ADMIN"); // TODO: Check user roles properly

    if (!isRider && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized to update this delivery" },
        { status: 403 }
      );
    }

    // Validate status transition
    if (!validTransitions[delivery.deliveryStatus].includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status transition from ${delivery.deliveryStatus} to ${status}`,
        },
        { status: 400 }
      );
    }

    const oldStatus = delivery.deliveryStatus;

    // Update delivery
    const updateData: any = {
      deliveryStatus: status,
      updatedAt: new Date(),
    };

    // Handle specific status updates
    if (status === "PICKED_UP") {
      updateData.pickupTime = new Date();
    } else if (status === "DELIVERED") {
      updateData.deliveryTime = new Date();
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      include: {
        rider: true,
        order: true,
      },
    });

    // Update order status if needed
    if (status === "DELIVERED") {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: {
          orderStatus: "DELIVERED",
          deliveredAt: new Date(),
        },
      });
    } else if (status === "OUT_FOR_DELIVERY") {
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: {
          orderStatus: "OUT_FOR_DELIVERY",
        },
      });
    }

    await prisma.deliveryLog.create({
      data: {
        deliveryId,
        eventType: "status_change",
        oldStatus,
        newStatus: status,
        description: `Status changed from ${oldStatus} to ${status}`,
        actorId: session.user.id,
        actorType: isAdmin ? "admin" : "rider",
        metadata: {
          notes,
          location,
        },
      },
    });

    if (status === "PICKED_UP") {
      await sendNotification({
        userId: delivery.order.customerId,
        message: "Order picked up",
        title: "delivery status change",
        type: "string",
        priority: "medium",
      });
    } else if (status === "OUT_FOR_DELIVERY") {
      await sendNotification({
        userId: delivery.order.customerId,
        message: "Order out for delivery",
        title: "delivery status change",
        type: "string",
        priority: "medium",
      });
    } else if (status === "DELIVERED") {
      await sendNotification({
        userId: delivery.order.customerId,
        message: "Order delivered",
        title: "delivery status change",
        type: "string",
        priority: "medium",
      });
    }

    // TODO: Broadcast real-time update
    // await broadcastDeliveryUpdate(deliveryId, {
    //   type: 'status_update',
    //   status,
    //   timestamp: new Date(),
    // });

    return NextResponse.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: {
        deliveryId,
        oldStatus,
        newStatus: status,
        updatedAt: updatedDelivery.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Update delivery status error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { deliveryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deliveryId = params.deliveryId;

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        rider: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            orderStatus: true,
            customerId: true,
            storeId: true,
            customer: {
              select: {
                fullName: true,
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

    // Check permissions
    const isRider = delivery.riderId === session.user.id;
    const isAdmin = session.user.roles?.includes("ADMIN");
    const isCustomer = delivery.order.customerId === session.user.id;
    const isMerchant = delivery.order.storeId === session.user.id;

    if (!isRider && !isAdmin && !isCustomer && !isMerchant) {
      return NextResponse.json(
        { error: "Unauthorized to view this delivery" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: delivery,
    });
  } catch (error: any) {
    console.error("Get delivery status error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
