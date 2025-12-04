import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("latitude") || "0");
    const longitude = parseFloat(searchParams.get("longitude") || "0");
    const radius = parseFloat(searchParams.get("radius") || "5"); // 5km default for assignment

    // Check rider status and location validity
    const rider = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        isAvailable: true,
        isActive: true,
        currentLat: true,
        currentLng: true,
        lastLocationUpdate: true,
      },
    });

    if (!rider || !rider.isAvailable || !rider.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Rider not available or inactive",
          code: "RIDER_INACTIVE",
        },
        { status: 403 }
      );
    }

    // Check if rider has recent location data (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (
      !rider.lastLocationUpdate ||
      rider.lastLocationUpdate < fiveMinutesAgo
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Location data is outdated. Please update your location.",
          code: "LOCATION_OUTDATED",
        },
        { status: 403 }
      );
    }

    // Check if rider has valid coordinates
    if (!rider.currentLat || !rider.currentLng) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Location coordinates not available. Please enable location services.",
          code: "LOCATION_MISSING",
        },
        { status: 403 }
      );
    }

    // Find unassigned deliveries that are ready for pickup
    const deliveries = await prisma.delivery.findMany({
      where: {
        riderId: null, // Unassigned deliveries
        deliveryStatus: "ASSIGNED", // Status indicating ready for rider assignment
        order: {
          orderStatus: "READY_FOR_PICKUP",
        },
      },
      include: {
        order: {
          include: {
            customer: {
              select: { id: true, fullName: true, phoneNumber: true },
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
            orderItems: {
              include: {
                product: {
                  select: { id: true, name: true, price: true },
                },
              },
            },
          },
        },
      },
    });

    // Filter by distance from rider location to store
    const nearbyDeliveries = deliveries.filter((delivery) => {
      if (!delivery.order.store.latitude || !delivery.order.store.longitude) {
        return false;
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        delivery.order.store.latitude,
        delivery.order.store.longitude
      );

      return distance <= radius;
    });

    // Sort by distance (closest first)
    nearbyDeliveries.sort((a, b) => {
      const distanceA = calculateDistance(
        latitude,
        longitude,
        a.order.store.latitude!,
        a.order.store.longitude!
      );
      const distanceB = calculateDistance(
        latitude,
        longitude,
        b.order.store.latitude!,
        b.order.store.longitude!
      );
      return distanceA - distanceB;
    });

    return NextResponse.json({
      success: true,
      data: nearbyDeliveries,
      count: nearbyDeliveries.length,
    });
  } catch (error: any) {
    console.error("Get available deliveries error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}
