import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MAX_BATCH_SIZE = 500;
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

    const body = await request.json();
    const { locations } = body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { success: false, message: "Locations array is required" },
        { status: 400 }
      );
    }

    if (locations.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, message: "Batch size too large" },
        { status: 413 }
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

    const locationEntries: any[] = [];
    let latestLocation: { latitude: number; longitude: number } | null = null;
    let latestTimestamp = 0;

    for (const loc of locations) {
      const {
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        altitude,
        timestamp,
      } = loc ?? {};

      if (typeof latitude !== "number" || typeof longitude !== "number") {
        continue;
      }

      if (typeof accuracy === "number" && accuracy > MAX_ACCURACY_METERS) {
        continue;
      }

      const ts = Number(new Date(timestamp).getTime());
      if (!Number.isFinite(ts)) continue;

      if (ts > latestTimestamp) {
        latestTimestamp = ts;
        latestLocation = { latitude, longitude };
      }

      locationEntries.push({
        riderId: riderProfile.id,
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        speed: speed ?? null,
        heading: heading ?? null,
        altitude: altitude ?? null,
        activity: "moving",
        batteryLevel: null,
        createdAt: new Date(ts),
      });
    }

    if (locationEntries.length === 0) {
      return NextResponse.json(
        { success: false, message: "No valid locations provided" },
        { status: 400 }
      );
    }

    // DB operations must be atomic
    await prisma.$transaction(async (tx) => {
      if (latestLocation) {
        await tx.riderProfile.update({
          where: { id: riderProfile.id },
          data: {
            currentLat: latestLocation.latitude,
            currentLng: latestLocation.longitude,
            lastLocationUpdate: new Date(),
          },
        });
      }

      // Insert in chunks (safe for large batches)
      const CHUNK_SIZE = 100;
      for (let i = 0; i < locationEntries.length; i += CHUNK_SIZE) {
        await tx.riderLocation.createMany({
          data: locationEntries.slice(i, i + CHUNK_SIZE),
          skipDuplicates: true,
        });
      }
    });

    // -------- SERVICE AREA CHECK (LATEST ONLY) --------
    let inServiceArea = false;

    if (latestLocation) {
      const serviceAreas = await prisma.serviceArea.findMany({
        where: { isActive: true },
      });

      for (const area of serviceAreas) {
        const bounds = area.bounds as {
          north: number;
          south: number;
          east: number;
          west: number;
        };

        if (
          latestLocation.latitude < bounds.south ||
          latestLocation.latitude > bounds.north ||
          latestLocation.longitude < bounds.west ||
          latestLocation.longitude > bounds.east
        ) {
          continue;
        }

        const distance = calculateDistance(
          latestLocation.latitude,
          latestLocation.longitude,
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
            description: `Batch update outside service area`,
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${locationEntries.length} location updates`,
      data: {
        syncedCount: locationEntries.length,
        inServiceArea,
        latestLocation,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[BATCH_LOCATION_SYNC]", error);
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
