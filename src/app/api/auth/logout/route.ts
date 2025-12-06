import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    console.log("🚪 Logout API called");
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );

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

    if (!user || !user.isActive || !user.phoneVerified) {
      console.log("❌ User account is not active or verified", {
        userId: session.user.id,
        isActive: user?.isActive,
        phoneVerified: user?.phoneVerified,
      });
      return NextResponse.json(
        { success: false, message: "Account is not active or verified" },
        { status: 403 }
      );
    }

    console.log("🔄 Starting logout cleanup for user:", session.user.id);

    // Get ALL active sessions for this user
    const activeSessions = await prisma.session.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        device: true,
      },
    });

    console.log(
      `Found ${activeSessions.length} active sessions to clean up for user ${session.user.id}`
    );
    console.log(
      "Active sessions:",
      activeSessions.map((s) => ({
        id: s.id,
        deviceId: s.deviceId,
        createdAt: s.createdAt,
      }))
    );

    // Clean up each active session
    for (const sessionRecord of activeSessions) {
      // Log the logout in device login log for each session
      await prisma.deviceLoginLog.create({
        data: {
          userId: session.user.id,
          deviceId: sessionRecord.deviceId || "unknown",
          loginType: "LOGOUT",
          ipAddress: sessionRecord.ipAddress || "unknown",
          userAgent: sessionRecord.userAgent || "",
          location: sessionRecord.location || {},
          deviceType: sessionRecord.device?.deviceType || "unknown",
          riskLevel: "LOW",
          isSuspicious: false,
        },
      });

      // Mark session as inactive
      await prisma.session.update({
        where: { id: sessionRecord.id },
        data: {
          isActive: false,
          lastActivity: new Date(),
        },
      });

      // Update device last login info if device exists
      if (sessionRecord.deviceId) {
        await prisma.device.update({
          where: { id: sessionRecord.deviceId },
          data: {
            lastLoginAt: new Date(),
          },
        });
      }
    }

    console.log("✅ Database logout cleanup completed");

    return NextResponse.json({
      success: true,
      message: "Logout cleanup completed",
      sessionsCleaned: activeSessions.length,
    });
  } catch (error: any) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
