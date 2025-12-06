import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeviceTracker } from "@/middleware/deviceTracking";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { activeRole: true },
    });

    if (adminUser?.activeRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = params;

    // Prevent admin from logging out themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { success: false, message: "Cannot logout yourself remotely" },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, activeRole: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get all active sessions for the user
    const activeSessions = await DeviceTracker.getActiveSessions(userId);

    // Terminate all sessions
    const terminatedCount = await DeviceTracker.terminateAllSessions(userId);

    // Log the admin action in device login log
    await prisma.deviceLoginLog.create({
      data: {
        userId,
        deviceId: "admin_action",
        loginType: "ADMIN_REMOTE_LOGOUT",
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
        userAgent: request.headers.get("user-agent") || "",
        location: {},
        deviceType: "admin",
        riskLevel: "LOW",
        riskReasons: [`Admin ${session.user.id} remotely logged out user`],
        isSuspicious: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully logged out ${targetUser.fullName || "user"} from ${terminatedCount} device(s)`,
      data: {
        userId,
        userName: targetUser.fullName,
        terminatedSessions: terminatedCount,
        activeSessionsBefore: activeSessions.length,
      },
    });
  } catch (error: any) {
    console.error("Admin remote logout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
