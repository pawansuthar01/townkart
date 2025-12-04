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
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { success: false, message: "Enabled status must be a boolean" },
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

    // Update rider availability (tracking status)
    await prisma.riderProfile.update({
      where: { id: riderProfile.id },
      data: {
        isAvailable: enabled,
        lastLocationUpdate: enabled ? new Date() : undefined,
      },
    });

    // Log the tracking status change
    await prisma.riderLog.create({
      data: {
        riderId: riderProfile.id,
        eventType: enabled
          ? "location_tracking_enabled"
          : "location_tracking_disabled",
        description: `Location tracking ${enabled ? "enabled" : "disabled"}`,
        latitude: riderProfile.currentLat || undefined,
        longitude: riderProfile.currentLng || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Location tracking ${enabled ? "enabled" : "disabled"} successfully`,
      isTracking: enabled,
    });
  } catch (error) {
    console.error("Error toggling rider location tracking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
