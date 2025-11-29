import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.activeRole !== "RIDER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
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
      batteryLevel,
      activity,
    } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, message: "Latitude and longitude are required" },
        { status: 400 },
      );
    }

    // Get rider profile
    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!riderProfile) {
      return NextResponse.json(
        { success: false, message: "Rider profile not found" },
        { status: 404 },
      );
    }

    // Update rider's current location
    await prisma.riderProfile.update({
      where: { id: riderProfile.id },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        lastLocationUpdate: new Date(),
      },
    });

    // Create location history entry
    await prisma.riderLocation.create({
      data: {
        riderId: riderProfile.id,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        altitude,
        activity: activity || "moving",
        batteryLevel,
      },
    });

    // Check if rider is in service area
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
        latitude >= bounds.south &&
        latitude <= bounds.north &&
        longitude >= bounds.west &&
        longitude <= bounds.east
      ) {
        // Calculate distance from center
        const distance = calculateDistance(
          latitude,
          longitude,
          area.centerLat,
          area.centerLng,
        );
        if (distance <= area.radiusKm) {
          inServiceArea = true;
          break;
        }
      }
    }

    // Log location issue if outside service area
    if (!inServiceArea) {
      await prisma.riderLog.create({
        data: {
          riderId: riderProfile.id,
          eventType: "location_outside_service_area",
          description: `Rider location update outside service area: ${latitude}, ${longitude}`,
          latitude,
          longitude,
        },
      });
    }

    // Check for location spoofing (simplified check)
    if (accuracy && accuracy > 1000) {
      // Very low accuracy might indicate spoofing
      await prisma.riderLog.create({
        data: {
          riderId: riderProfile.id,
          eventType: "location_accuracy_warning",
          description: `Low location accuracy detected: ${accuracy}m at ${latitude}, ${longitude}`,
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
    console.error("Error updating rider location:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.activeRole !== "RIDER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        currentLat: true,
        currentLng: true,
        lastLocationUpdate: true,
        isAvailable: true,
      },
    });

    if (!riderProfile) {
      return NextResponse.json(
        { success: false, message: "Rider profile not found" },
        { status: 404 },
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
    console.error("Error fetching rider location:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper function to calculate distance
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
