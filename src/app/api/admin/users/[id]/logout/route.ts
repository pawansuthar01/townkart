import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnlyMiddleware } from "@/middleware/auth.middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    const authResult = await adminOnlyMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const userId = params.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        activeRole: true,
        email: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has any active sessions
    const activeSessionCount = await prisma.session.count({
      where: {
        userId: userId,
        isActive: true,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (activeSessionCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User is not currently logged in",
          data: { userId, userName: user.fullName },
        },
        { status: 400 }
      );
    }

    // Invalidate all active sessions for this user
    const logoutResult = await prisma.session.updateMany({
      where: {
        userId: userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Deactivate all devices for this user
    await prisma.device.updateMany({
      where: {
        userId: userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Update user's last logout timestamp for immediate logout
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLogoutAt: new Date(),
      },
    });

    // Log the logout action with detailed information
    console.log(
      `Admin logged out user ${userId} (${user.fullName}) from ${logoutResult.count} active sessions`
    );

    // Log device logout activity
    await prisma.deviceLoginLog.create({
      data: {
        userId,
        deviceId: "admin_action",
        loginType: "ADMIN_FORCE_LOGOUT",
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown",
        userAgent: request.headers.get("user-agent") || "",
        location: {},
        deviceType: "admin",
        riskLevel: "LOW",
        riskReasons: [`Admin forced logout for user ${user.fullName}`],
        isSuspicious: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.fullName || "user"} logged out successfully from ${logoutResult.count} device(s)`,
      data: {
        userId,
        userName: user.fullName,
        sessionsTerminated: logoutResult.count,
        userRole: user.activeRole,
      },
    });
  } catch (error) {
    console.error("Admin logout user error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to logout user",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
