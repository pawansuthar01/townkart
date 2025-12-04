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
    const { eventType, ...eventData } = body;

    // Get the rider profile ID for the logged-in user
    const riderProfile = await prisma.riderProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!riderProfile) {
      return NextResponse.json(
        { success: false, message: "Rider profile not found" },
        { status: 404 }
      );
    }

    // Log location event
    await prisma.riderLog.create({
      data: {
        riderId: riderProfile.id,
        eventType: `location_${eventType}`,
        description: `Location event: ${eventType}`,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        metadata: eventData,
      },
    });

    // Handle critical events
    if (eventType === "permission_denied" || eventType === "location_lost") {
      // Update rider status to offline
      await prisma.riderProfile.update({
        where: { userId: session.user.id },
        data: { isAvailable: false },
      });

      // Send admin alert for critical GPS issues
      await sendAdminAlert(eventType, {
        riderId: riderProfile.id,
        riderName: session.user.name,
        ...eventData,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Location event logged successfully",
    });
  } catch (error) {
    console.error("Error logging location event:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendAdminAlert(eventType: string, data: any) {
  try {
    // Get admin users
    const adminUsers = await prisma.user.findMany({
      where: { activeRole: "ADMIN" },
    });

    // Send notifications to admins
    const { notificationManager } = await import("@/lib/notificationSystem");

    for (const admin of adminUsers) {
      await notificationManager.broadcastNotification(
        [
          {
            userId: admin.id,
            userType: "admin" as const,
          },
        ],
        "rider_location_alert",
        {
          title: `🚨 Rider GPS Alert: ${eventType.replace("_", " ").toUpperCase()}`,
          message: `Rider ${data.riderName} (${data.riderId}) has ${eventType.replace("_", " ")}. Immediate attention required.`,
          priority: "high",
          riderId: data.riderId,
          eventType,
          timestamp: new Date().toISOString(),
        }
      );
    }
  } catch (error) {
    console.error("Error sending admin alert:", error);
  }
}
