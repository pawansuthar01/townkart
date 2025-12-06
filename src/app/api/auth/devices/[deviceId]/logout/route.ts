import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeviceTracker } from "@/middleware/deviceTracking";

export async function POST(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { deviceId } = params;

    // Check if the device belongs to the user
    const device = await prisma.device.findFirst({
      where: {
        userId: session.user.id,
        deviceId,
        isActive: true,
      },
    });

    if (!device) {
      return NextResponse.json(
        { success: false, message: "Device not found or not active" },
        { status: 404 }
      );
    }

    // Find sessions associated with this device
    const deviceSessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        deviceId: device.id,
        expires: { gt: new Date() },
      },
    });

    if (deviceSessions.length === 0) {
      return NextResponse.json(
        { success: false, message: "No active sessions found for this device" },
        { status: 404 }
      );
    }

    // Terminate all sessions for this device
    const terminatedCount = await prisma.session.updateMany({
      where: {
        userId: session.user.id,
        deviceId: device.id,
      },
      data: {
        isActive: false,
        lastActivity: new Date(),
      },
    });

    // Log the device logout
    for (const sessionRecord of deviceSessions) {
      await DeviceTracker.logDeviceLogin(
        session.user.id,
        deviceId,
        "DEVICE_LOGOUT",
        {
          deviceInfo: {
            deviceId,
            deviceType: device.deviceType,
          },
          locationInfo: {
            ip: sessionRecord.ipAddress || "unknown",
            ...(sessionRecord.location as any),
          },
          userAgent: sessionRecord.userAgent || "",
        },
        "LOW",
        ["User manually logged out device"]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully logged out device "${device.deviceName || deviceId}"`,
      data: {
        deviceId,
        deviceName: device.deviceName,
        terminatedSessions: terminatedCount.count,
      },
    });
  } catch (error: any) {
    console.error("Device logout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
