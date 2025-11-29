import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get all riders with their current locations
    const riders = await prisma.riderProfile.findMany({
      where: includeInactive
        ? {}
        : {
            isActive: true,
          },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
        deliveries: {
          where: {
            deliveryStatus: {
              in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"],
            },
          },
          take: 1,
          include: {
            order: {
              select: {
                orderNumber: true,
                customer: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      take: limit,
      orderBy: {
        lastLocationUpdate: "desc",
      },
    });

    // Get recent location history for each rider (last location in last 24 hours)
    const riderIds = riders.map((r) => r.id);
    const recentLocations = await prisma.riderLocation.findMany({
      where: {
        riderId: {
          in: riderIds,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Group locations by rider
    const locationMap = new Map();
    recentLocations.forEach((location) => {
      if (!locationMap.has(location.riderId)) {
        locationMap.set(location.riderId, []);
      }
      locationMap.get(location.riderId).push({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        speed: location.speed,
        timestamp: location.createdAt,
      });
    });

    // Format response
    const riderLocations = riders.map((rider) => {
      const locations = locationMap.get(rider.id) || [];
      const latestLocation = locations.length > 0 ? locations[0] : null;

      return {
        riderId: rider.id,
        userId: rider.user.id,
        name: rider.user.fullName,
        phoneNumber: rider.user.phoneNumber,
        email: rider.user.email,
        isAvailable: rider.isAvailable,
        isActive: rider.isActive,
        isVerified: rider.isVerified,
        vehicleType: rider.vehicleType,
        rating: rider.rating,
        totalDeliveries: rider._count.deliveries,
        currentLocation:
          rider.currentLat && rider.currentLng
            ? {
                latitude: rider.currentLat,
                longitude: rider.currentLng,
                lastUpdate: rider.lastLocationUpdate,
                accuracy: latestLocation?.accuracy,
                speed: latestLocation?.speed,
              }
            : null,
        activeDelivery:
          rider.deliveries.length > 0
            ? {
                id: rider.deliveries[0].id,
                orderNumber: rider.deliveries[0].order.orderNumber,
                customerName: rider.deliveries[0].order.customer.fullName,
                status: rider.deliveries[0].deliveryStatus,
              }
            : null,
        recentLocations: locations.slice(0, 10), // Last 10 locations
      };
    });

    // Sort by availability and last location update
    riderLocations.sort((a, b) => {
      // Available riders first
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;

      // Then by last location update (most recent first)
      const aTime = a.currentLocation?.lastUpdate?.getTime() || 0;
      const bTime = b.currentLocation?.lastUpdate?.getTime() || 0;
      return bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      data: {
        riders: riderLocations,
        summary: {
          total: riderLocations.length,
          available: riderLocations.filter((r) => r.isAvailable).length,
          withLocation: riderLocations.filter((r) => r.currentLocation).length,
          activeDeliveries: riderLocations.filter((r) => r.activeDelivery)
            .length,
        },
      },
    });
  } catch (error: any) {
    console.error("Get all riders locations error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
