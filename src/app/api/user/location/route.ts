import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_ACCURACY_METERS = 1000;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.activeRole !== "CUSTOMER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Customer access required" },
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

    const customerProfile = await prisma.customerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!customerProfile) {
      return NextResponse.json(
        { success: false, message: "Customer profile not found" },
        { status: 404 }
      );
    }

    // Update customer location in database
    await prisma.customerProfile.update({
      where: { id: customerProfile.id },
      data: {
        // Note: Customer profiles may not have location fields in schema
        // This might need to be added to the database schema
        // For now, we'll store in a separate location tracking table
      },
    });

    // Create customer location log
    await prisma.locationDataRecord.create({
      data: {
        userId: session.user.id,
        consentId: "customer_location_tracking", // This would need to be created
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        timestamp: new Date(),
        purpose: "customer_location_tracking",
        collectedAt: new Date(),
        retentionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isAnonymized: false,
        source: "app",
      },
    });

    // Check if customer is in service area
    const serviceAreas = await prisma.serviceArea.findMany({
      where: { isActive: true },
    });

    let inServiceArea = false;
    for (const area of serviceAreas) {
      const bounds = area.bounds as {
        north: number;
        south: number;
        east: number;
        west: number;
      };

      if (
        latitude < bounds.south ||
        latitude > bounds.north ||
        longitude < bounds.west ||
        longitude > bounds.east
      ) {
        continue;
      }

      const distance = calculateDistance(
        latitude,
        longitude,
        area.centerLat,
        area.centerLng
      );

      if (Number.isFinite(distance) && distance <= area.radiusKm) {
        inServiceArea = true;
        break;
      }
    }

    if (!inServiceArea) {
      await prisma.locationAuditLog.create({
        data: {
          userId: session.user.id,
          action: "LOCATION_COLLECTED_OUTSIDE_SERVICE_AREA",
          purpose: "customer_location_tracking",
          details: { latitude, longitude, inServiceArea: false },
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      data: {
        inServiceArea,
        accuracy,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[CUSTOMER_LOCATION_UPDATE]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get customer's current location
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.activeRole !== "CUSTOMER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Customer access required" },
        { status: 401 }
      );
    }

    // Get customer's last location from location data records
    const lastLocation = await prisma.locationDataRecord.findFirst({
      where: {
        userId: session.user.id,
        purpose: "customer_location_tracking",
      },
      orderBy: {
        collectedAt: "desc",
      },
    });

    if (!lastLocation) {
      return NextResponse.json({
        success: true,
        data: {
          location: null,
          message: "No location data available",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        location: {
          latitude: lastLocation.latitude,
          longitude: lastLocation.longitude,
          accuracy: lastLocation.accuracy,
          timestamp: lastLocation.timestamp,
          lastUpdate: lastLocation.collectedAt,
        },
      },
    });
  } catch (error) {
    console.error("[GET_CUSTOMER_LOCATION]", error);
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
