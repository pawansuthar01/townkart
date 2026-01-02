import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_ACCURACY_METERS = 1000;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.activeRole !== "RIDER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error("[LOCATION_UPDATE] Invalid JSON in request body:", error);
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const {
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      altitude,
      batteryLevel,
      activity,
    } = body ?? {};

    console.log("[LOCATION_UPDATE] Received data:", {
      latitude,
      longitude,
      accuracy,
      hasSpeed: speed !== undefined,
      hasHeading: heading !== undefined,
    });

    // ✅ 0 is valid – strict numeric check
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      console.error("[LOCATION_UPDATE] Invalid coordinates:", {
        latitude,
        longitude,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Latitude and longitude are required and must be numbers",
        },
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

    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!riderProfile) {
      return NextResponse.json(
        { success: false, message: "Rider profile not found" },
        { status: 404 }
      );
    }

    // ---------- ATOMIC DB OPERATIONS ----------
    await prisma.$transaction(async (tx) => {
      await tx.riderProfile.update({
        where: { id: riderProfile.id },
        data: {
          currentLat: latitude,
          currentLng: longitude,
          lastLocationUpdate: new Date(),
        },
      });

      await tx.riderLocation.create({
        data: {
          riderId: riderProfile.id,
          latitude,
          longitude,
          accuracy: accuracy ?? null,
          speed: speed ?? null,
          heading: heading ?? null,
          altitude: altitude ?? null,
          activity: activity || "moving",
          batteryLevel: batteryLevel ?? null,
          createdAt: new Date(),
        },
      });
    });

    // ---------- SERVICE AREA CHECK ----------
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
      await prisma.riderLog.create({
        data: {
          riderId: riderProfile.id,
          eventType: "location_outside_service_area",
          description: "Rider location update outside service area",
          latitude,
          longitude,
        },
      });
    }

    // ---------- ACCURACY WARNING (LOG ONLY) ----------
    if (typeof accuracy === "number" && accuracy > 500) {
      await prisma.riderLog.create({
        data: {
          riderId: riderProfile.id,
          eventType: "location_accuracy_warning",
          description: `Low accuracy detected: ${accuracy}m`,
          latitude,
          longitude,
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
    console.error("[LOCATION_UPDATE]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------- GET ----------------

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.activeRole !== "RIDER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        currentLat: true,
        currentLng: true,
        lastLocationUpdate: true,
        isAvailable: true,
      },
    });

    if (!riderProfile) {
      return NextResponse.json(
        { success: false, message: "Rider profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        location: {
          latitude: riderProfile.currentLat,
          longitude: riderProfile.currentLng,
          lastUpdate: riderProfile.lastLocationUpdate,
        },
        isAvailable: riderProfile.isAvailable,
      },
    });
  } catch (error) {
    console.error("[GET_RIDER_LOCATION]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------- HELPERS ----------------

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(v: number): number {
  return (v * Math.PI) / 180;
}
