import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user as any).activeRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { id, deviceId } = params;

    // Verify the device belongs to the target user
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        userId: id,
      },
    });

    if (!device) {
      return NextResponse.json(
        { success: false, message: "Device not found for this user" },
        { status: 404 }
      );
    }

    // Mark all sessions for this device as inactive
    const updateResult = await prisma.session.updateMany({
      where: {
        deviceId: deviceId,
        isActive: true,
      },
      data: {
        isActive: false,
        lastActivity: new Date(),
      },
    });

    // Log the admin-forced device logout
    await prisma.deviceLoginLog.create({
      data: {
        userId: id,
        deviceId: deviceId,
        loginType: "LOGOUT",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "",
        location: {}, // Could be populated with IP geolocation
        deviceType: device.deviceType,
        riskLevel: "HIGH", // Admin forced logout
        isSuspicious: true,
      },
    });

    // Update device last login info
    await prisma.device.update({
      where: { id: deviceId },
      data: {
        lastLoginAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Device logged out successfully by admin",
      data: {
        id,
        deviceId,
        sessionsTerminated: updateResult.count,
        adminId: session.user.id,
      },
    });
  } catch (error: any) {
    console.error("Admin device logout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
