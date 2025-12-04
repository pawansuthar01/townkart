import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
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
        id: true,
        isAvailable: true,
        currentLat: true,
        currentLng: true,
        lastLocationUpdate: true,
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
      isTracking: riderProfile.isAvailable,
      lastUpdate: riderProfile.lastLocationUpdate?.toISOString(),
      currentLocation:
        riderProfile.currentLat && riderProfile.currentLng
          ? {
              latitude: riderProfile.currentLat,
              longitude: riderProfile.currentLng,
              lastUpdate: riderProfile.lastLocationUpdate?.toISOString(),
            }
          : null,
    });
  } catch (error) {
    console.error("Error fetching rider location status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
