import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { broadcastOrderStatusChange } from "@/lib/websocket";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } },
) {
  try {
    const orderId = params.orderId;

    // Get order with status history
    const order = (await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        delivery: {
          include: {
            rider: {
              select: {
                user: {
                  select: {
                    fullName: true,
                    phoneNumber: true,
                  },
                },
                id: true,
              },
            },
          },
        },
      },
    })) as any; // Type assertion for now due to schema migration

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Create status timeline
    const timeline = [];

    // Order placed
    timeline.push({
      status: "ORDER_PLACED",
      label: "Order Placed",
      timestamp: order.createdAt,
      completed: true,
      description: "Your order has been successfully placed",
    });

    // Store assigned (assume it's assigned when order is created)
    timeline.push({
      status: "STORE_ASSIGNED",
      label: "Store Assigned",
      timestamp: order.createdAt,
      completed: true,
      description: `Order assigned to ${order.store.name}`,
    });

    // Being prepared
    const beingPreparedTime = order.confirmedAt || order.createdAt;
    timeline.push({
      status: "BEING_PREPARED",
      label: "Being Prepared",
      timestamp: beingPreparedTime,
      completed: [
        "PREPARING",
        "READY_FOR_PICKUP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(order.orderStatus),
      description: "Your order is being prepared",
    });

    // Ready for pickup
    if (order.readyAt) {
      timeline.push({
        status: "READY_FOR_PICKUP",
        label: "Ready for Pickup",
        timestamp: order.readyAt,
        completed: [
          "READY_FOR_PICKUP",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
        ].includes(order.orderStatus),
        description: "Your order is ready for pickup",
      });
    }

    // Rider assigned
    if (order.delivery) {
      timeline.push({
        status: "RIDER_ASSIGNED",
        label: "Rider Assigned",
        timestamp: order.delivery.createdAt,
        completed: [
          "ASSIGNED",
          "PICKED_UP",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
        ].includes(order.delivery.deliveryStatus),
        description: `Rider ${order.delivery.rider?.fullName || "assigned"} will deliver your order`,
      });

      // En route
      if (order.delivery.pickupTime) {
        timeline.push({
          status: "EN_ROUTE",
          label: "En Route",
          timestamp: order.delivery.pickupTime,
          completed: ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
            order.delivery.deliveryStatus,
          ),
          description: "Your order is on the way",
        });
      }
    }

    // Delivered
    if (order.deliveredAt) {
      timeline.push({
        status: "DELIVERED",
        label: "Delivered",
        timestamp: order.deliveredAt,
        completed: order.orderStatus === "DELIVERED",
        description: "Your order has been successfully delivered",
      });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        customer: order.customer,
        store: order.store,
        items: order.orderItems.length,
        total: order.finalAmount,
        deliveryAddress: order.deliveryAddress,
        specialInstructions: order.specialInstructions,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
      },
      timeline,
      delivery: order.delivery
        ? {
            status: order.delivery.deliveryStatus,
            rider: order.delivery.rider,
            estimatedDeliveryTime: order.delivery.estimatedDeliveryTime,
          }
        : null,
    });
  } catch (error) {
    console.error("Order status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.orderId;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    // Update order status using the order status management system
    const { orderStatusManager } = await import("@/lib/orderStatusManagement");
    const result = await orderStatusManager.transitionStatus(
      orderId,
      status as any, // Type assertion for now
      {
        id: session.user.id,
        type: "merchant", // Store manager updating status
        name: session.user.name || "Store Manager",
      },
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors?.[0] || "Status update failed" },
        { status: 400 },
      );
    }

    // Broadcast the status change via WebSocket
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        customerId: true,
        storeId: true,
        delivery: {
          select: {
            riderId: true,
          },
        },
      },
    });

    if (order) {
      await broadcastOrderStatusChange(orderId, status, {
        customerId: order.customerId,
        storeId: order.storeId,
        riderId: order.delivery?.riderId,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
    });
  } catch (error) {
    console.error("Update order status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
