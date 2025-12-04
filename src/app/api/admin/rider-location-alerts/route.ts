import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.activeRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { riderId, alertType, lastLocation, timestamp } = body;

    // Get rider details
    const rider = await prisma.riderProfile.findUnique({
      where: { id: riderId },
      include: { user: true },
    });

    if (!rider) {
      return NextResponse.json(
        { success: false, message: "Rider not found" },
        { status: 404 }
      );
    }

    // Create alert as a notification
    await prisma.notification.create({
      data: {
        userId: session.user.id, // Send to admin
        title: `🚨 Rider GPS Alert: ${alertType.replace("_", " ").toUpperCase()}`,
        message: `Rider ${rider.user.fullName} (${riderId}) has ${alertType.replace("_", " ")}. Last location: ${lastLocation ? `${lastLocation.latitude}, ${lastLocation.longitude}` : "Unknown"}`,
        notificationType: "SYSTEM_NOTIFICATION",
        priority: alertType === "gps_lost_during_delivery" ? "high" : "high",
        referenceId: riderId,
      },
    });

    // Also log in rider logs for audit trail
    await prisma.riderLog.create({
      data: {
        riderId,
        eventType: `admin_alert_${alertType}`,
        description: `Admin alert triggered: ${alertType}`,
        latitude: lastLocation?.latitude,
        longitude: lastLocation?.longitude,
        metadata: {
          alertType,
          lastLocation,
          timestamp: timestamp || new Date().toISOString(),
          severity:
            alertType === "gps_lost_during_delivery" ? "CRITICAL" : "HIGH",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Rider location alert created successfully",
    });
  } catch (error) {
    console.error("Error creating rider location alert:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.activeRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get rider location alerts from notifications
    const alerts = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        notificationType: "SYSTEM_NOTIFICATION",
        title: { contains: "Rider GPS Alert" },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Error fetching rider location alerts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
