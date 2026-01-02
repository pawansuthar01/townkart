import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_ACCURACY_METERS = 1000;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.activeRole !== "STORE_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - Store manager access required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      altitude,
      activity,
      batteryLevel,
    } = body ?? {};

    // Validate required fields
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { success: false, message: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    if (typeof accuracy === "number" && accuracy > MAX_ACCURACY_METERS) {
      return NextResponse.json(
        {
          success: false,
          message: `Location accuracy too low (${Math.round(
            accuracy
          )}m). Please enable GPS and try again.`,
        },
        { status: 400 }
      );
    }

    // Find store managed by this user
    const store = await prisma.store.findFirst({
      where: {
        managerId: session.user.id,
        isActive: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "No active store found for this manager" },
        { status: 404 }
      );
    }

    // Update store location
    await prisma.store.update({
      where: { id: store.id },
      data: {
        latitude,
        longitude,
        // Note: You might want to add lastLocationUpdate field to Store model
      },
    });

    // Create store location log
    await prisma.locationDataRecord.create({
      data: {
        userId: session.user.id,
        consentId: "store_location_tracking", // This would need to be created
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        timestamp: new Date(),
        purpose: "store_location_tracking",
        collectedAt: new Date(),
        retentionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isAnonymized: false,
        source: "store_app",
      },
    });

    // Check if store is in its designated service area
    const serviceArea = await prisma.serviceArea.findUnique({
      where: { id: store.serviceAreaId },
    });

    let inServiceArea = false;
    if (serviceArea) {
      const bounds = serviceArea.bounds as {
        north: number;
        south: number;
        east: number;
        west: number;
      };

      if (
        latitude >= bounds.south &&
        latitude <= bounds.north &&
        longitude >= bounds.west &&
        longitude <= bounds.east
      ) {
        const distance = calculateDistance(
          latitude,
          longitude,
          serviceArea.centerLat,
          serviceArea.centerLng
        );

        if (Number.isFinite(distance) && distance <= serviceArea.radiusKm) {
          inServiceArea = true;
        }
      }
    }

    if (!inServiceArea) {
      await prisma.locationAuditLog.create({
        data: {
          userId: session.user.id,
          action: "STORE_LOCATION_OUTSIDE_SERVICE_AREA",
          purpose: "store_location_tracking",
          details: {
            storeId: store.id,
            latitude,
            longitude,
            serviceAreaId: store.serviceAreaId,
            inServiceArea: false,
          },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Store location updated successfully",
      data: {
        storeId: store.id,
        storeName: store.name,
        inServiceArea,
        accuracy,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[STORE_LOCATION_UPDATE]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get store's current location
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.activeRole !== "STORE_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized - Store manager access required",
        },
        { status: 401 }
      );
    }

    // Find store managed by this user
    const store = await prisma.store.findFirst({
      where: {
        managerId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        address: true,
        // Add lastLocationUpdate when available
      },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "No active store found for this manager" },
        { status: 404 }
      );
    }

    // Get store's last location from location data records
    const lastLocation = await prisma.locationDataRecord.findFirst({
      where: {
        userId: session.user.id,
        purpose: "store_location_tracking",
      },
      orderBy: {
        collectedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          address: store.address,
          registeredLocation: {
            latitude: store.latitude,
            longitude: store.longitude,
          },
        },
        currentLocation: lastLocation
          ? {
              latitude: lastLocation.latitude,
              longitude: lastLocation.longitude,
              accuracy: lastLocation.accuracy,
              timestamp: lastLocation.timestamp,
              lastUpdate: lastLocation.collectedAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[GET_STORE_LOCATION]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
