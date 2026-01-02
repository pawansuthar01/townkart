import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeviceTracker } from "@/middleware/deviceTracking";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session check result:", {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionKeys: session ? Object.keys(session) : null,
      userKeys: session?.user ? Object.keys(session.user) : null,
    });

    if (!session?.user?.id) {
      console.log("❌ No valid session found");
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is still active
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true, phoneVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 404 }
      );
    }

    const currentSessionToken = session.sessionToken;

    if (!currentSessionToken) {
      return NextResponse.json(
        { success: false, message: "Invalid session" },
        { status: 400 }
      );
    }

    // Find the current active session
    const currentSession = await prisma.session.findFirst({
      where: {
        userId: session.user.id,
        sessionToken: currentSessionToken,
        isActive: true,
        expires: {
          gt: new Date(),
        },
      },
      include: {
        device: true,
      },
    });

    if (!currentSession) {
      console.log("ℹ️ Current session not found or already inactive");
      return NextResponse.json({
        success: true,
        message: "User is already logged out",
        sessionsCleaned: 0,
      });
    }

    // Log the logout using DeviceTracker
    await DeviceTracker.logDeviceLogin(
      session.user.id,
      currentSession.deviceId || undefined,
      "LOGOUT",
      {
        deviceInfo: {
          deviceId: currentSession.deviceId || "unknown",
          deviceType: currentSession.device?.deviceType || "unknown",
        },
        locationInfo: {
          ip: currentSession.ipAddress || "unknown",
          ...(currentSession.location as any),
        },
        userAgent: currentSession.userAgent || "",
      },
      "LOW",
      ["User manually logged out from current device"]
    );

    // Mark current session as inactive
    await prisma.session.update({
      where: { id: currentSession.id },
      data: {
        isActive: false,
        lastActivity: new Date(),
      },
    });

    // Deactivate the device since user is logging out from it
    if (currentSession.deviceId) {
      await prisma.device.update({
        where: { id: currentSession.deviceId },
        data: {
          isActive: false,
        },
      });
    }

    console.log("✅ Current session logout cleanup completed");

    return NextResponse.json({
      success: true,
      message: "Successfully logged out from current device",
      sessionsCleaned: 1,
      deviceType: currentSession.device?.deviceType,
    });
  } catch (error: any) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
