import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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

    // Get delivery with rider information
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          select: {
            customerId: true,
          },
        },
        rider: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
              },
            },
            currentLat: true,
            currentLng: true,
            lastLocationUpdate: true,
            isAvailable: true,
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

    // Check permissions - customer can only see their own delivery's rider
    const isCustomer = session.user.roles?.includes("CUSTOMER");
    const isAdmin = session.user.roles?.includes("ADMIN");
    const isRider = session.user.roles?.includes("RIDER");

    if (isCustomer && delivery.order.customerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to view this delivery" },
        { status: 403 }
      );
    }

    if (isRider && delivery.rider?.id !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to view this delivery" },
        { status: 403 }
      );
    }

    // Get recent location history (last 10 locations)
    const recentLocations = await prisma.riderLocation.findMany({
      where: {
        riderId: delivery.rider?.id,
        deliveryId: deliveryId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        latitude: true,
        longitude: true,
        accuracy: true,
        speed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deliveryId,
        rider: delivery.rider
          ? {
              id: delivery.rider.id,
              name: delivery.rider.user.fullName,
              currentLocation: {
                latitude: delivery.rider.currentLat,
                longitude: delivery.rider.currentLng,
                lastUpdate: delivery.rider.lastLocationUpdate,
              },
              isAvailable: delivery.rider.isAvailable,
            }
          : null,
        recentLocations: recentLocations.reverse(), // Oldest first for path drawing
        deliveryStatus: delivery.deliveryStatus,
      },
    });
  } catch (error: any) {
    console.error("Get delivery location error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
