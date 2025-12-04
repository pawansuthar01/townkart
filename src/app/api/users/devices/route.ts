import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's devices
    const devices = await prisma.device.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        sessions: {
          where: {
            isActive: true,
          },
          orderBy: {
            lastActivity: "desc",
          },
          take: 1,
        },
        loginLogs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        lastLoginAt: "desc",
      },
    });

    // Format the response
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      os: device.os,
      browser: device.browser,
      lastLoginAt: device.lastLoginAt?.toISOString(),
      lastIP: device.lastIP,
      isTrusted: device.isTrusted,
      batteryLevel: device.batteryLevel,
      lastBatteryUpdate: device.lastBatteryUpdate?.toISOString(),
      loginCount: device.loginCount,
      currentSession: device.sessions[0]
        ? {
            id: device.sessions[0].id,
            lastActivity: device.sessions[0].lastActivity?.toISOString(),
            ipAddress: device.sessions[0].ipAddress,
            userAgent: device.sessions[0].userAgent,
          }
        : null,
      lastLoginLog: device.loginLogs[0]
        ? {
            ipAddress: device.loginLogs[0].ipAddress,
            userAgent: device.loginLogs[0].userAgent,
            location: device.loginLogs[0].location,
            createdAt: device.loginLogs[0].createdAt.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      devices: formattedDevices,
    });
  } catch (error) {
    console.error("Error fetching user devices:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch devices" },
      { status: 500 }
    );
  }
}
