import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's devices with session info
    const devices = await prisma.device.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        sessions: {
          where: {
            expires: { gt: new Date() },
          },
          orderBy: { lastActivity: "desc" },
        },
      },
      orderBy: { lastLoginAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        devices: devices.map((device) => ({
          ...device,
          lastLoginAt: device.lastLoginAt?.toISOString(),
          createdAt: device.createdAt.toISOString(),
          sessions: device.sessions.map((session) => ({
            ...session,
            expires: session.expires.toISOString(),
            lastActivity: session.lastActivity.toISOString(),
            createdAt: session.createdAt.toISOString(),
          })),
        })),
      },
    });
  } catch (error: any) {
    console.error("Get devices error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
