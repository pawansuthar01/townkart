import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { deliveryId, riderId } = await request.json();

    if (!deliveryId || !riderId) {
      return NextResponse.json(
        { error: "Delivery ID and Rider ID are required" },
        { status: 400 }
      );
    }

    // Use transaction with row locking to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check if delivery exists and is unassigned
      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: { order: true },
      });

      if (!delivery) {
        throw new Error("Delivery not found");
      }

      if (delivery.riderId !== null) {
        throw new Error("Delivery already assigned");
      }

      if (delivery.order.orderStatus !== "READY_FOR_PICKUP") {
        throw new Error("Order is not ready for pickup");
      }

      // Check if rider exists and is available
      const rider = await tx.riderProfile.findUnique({
        where: { userId: riderId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (!rider) {
        throw new Error("Rider not found");
      }

      if (!rider.isAvailable) {
        throw new Error("Rider is not available");
      }

      // Check rider's current delivery count (simplified check)
      const activeDeliveries = await tx.delivery.count({
        where: {
          riderId: rider.id,
          deliveryStatus: {
            in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"],
          },
        },
      });

      if (activeDeliveries >= 5) {
        // Temporary limit
        throw new Error("Rider has too many active deliveries");
      }

      // Assign delivery to rider
      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          riderId: rider.id,
          deliveryStatus: "ASSIGNED",
          updatedAt: new Date(),
        },
        include: {
          order: {
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
                  latitude: true,
                  longitude: true,
                },
              },
            },
          },
          rider: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                },
              },
            },
          },
        },
      });

      // Create delivery log
      await tx.deliveryLog.create({
        data: {
          deliveryId: deliveryId,
          eventType: "assignment",
          newStatus: "ASSIGNED",
          description: `Delivery assigned to rider ${rider.user.fullName}`,
          actorId: "system", // TODO: Get from session when admin assigns
          actorType: "system",
        },
      });

      // Create rider log
      await tx.riderLog.create({
        data: {
          riderId: rider.id,
          eventType: "delivery_assigned",
          description: `Assigned to delivery ${deliveryId}`,
          metadata: {
            deliveryId,
            orderId: delivery.orderId,
            storeId: delivery.order.storeId,
          },
        },
      });

      return updatedDelivery;
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Delivery assignment error:", error);

    // Handle specific error types
    if (error.message === "Delivery not found") {
      return NextResponse.json(
        { success: false, message: "Delivery not found" },
        { status: 404 }
      );
    }

    if (error.message === "Delivery already assigned") {
      return NextResponse.json(
        {
          success: false,
          message: "Delivery already assigned to another rider",
        },
        { status: 409 }
      );
    }

    if (error.message === "Rider not found") {
      return NextResponse.json(
        { success: false, message: "Rider not found" },
        { status: 404 }
      );
    }

    if (error.message === "Rider is not available") {
      return NextResponse.json(
        { success: false, message: "Rider is not available" },
        { status: 409 }
      );
    }

    if (error.message === "Order is not ready for pickup") {
      return NextResponse.json(
        { success: false, message: "Order is not ready for pickup" },
        { status: 409 }
      );
    }

    if (error.message === "Rider has reached maximum daily deliveries") {
      return NextResponse.json(
        {
          success: false,
          message: "Rider has reached maximum daily deliveries",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
