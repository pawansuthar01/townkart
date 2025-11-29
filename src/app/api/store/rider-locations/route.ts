import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get store staff's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
      );
    }

    // Get active deliveries for this store with rider locations
    const activeDeliveries = await prisma.delivery.findMany({
      where: {
        order: {
          storeId: storeStaff.storeId,
        },
        deliveryStatus: {
          in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"],
        },
        riderId: {
          not: null,
        },
      },
      include: {
        rider: {
          include: {
            user: {
              select: {
                id: true,
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
            deliveryAddress: true,
          },
        },
        riderLocations: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get latest location
        },
      },
    });

    // Transform data for frontend
    const riderLocations = activeDeliveries.map((delivery) => ({
      deliveryId: delivery.id,
      orderId: delivery.order.id,
      orderNumber: delivery.order.orderNumber,
      deliveryAddress: delivery.order.deliveryAddress,
      rider: {
        id: delivery.rider?.id,
        name: delivery.rider?.user.fullName,
        phone: delivery.rider?.user.phoneNumber,
      },
      status: delivery.deliveryStatus,
      currentLocation: delivery.riderLocations[0]
        ? {
            latitude: delivery.riderLocations[0].latitude,
            longitude: delivery.riderLocations[0].longitude,
            accuracy: delivery.riderLocations[0].accuracy,
            timestamp: delivery.riderLocations[0].createdAt,
            activity: delivery.riderLocations[0].activity,
          }
        : null,
      pickupTime: delivery.pickupTime,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
    }));

    return NextResponse.json({
      success: true,
      riderLocations,
    });
  } catch (error) {
    console.error("Store rider locations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
