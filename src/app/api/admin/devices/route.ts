import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const userRole = searchParams.get("role");
    const isOnline = searchParams.get("online");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (userRole) {
      where.user = {
        userRoles: { has: userRole },
      };
    }

    if (isOnline === "true") {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: "insensitive" } } },
        { user: { phoneNumber: { contains: search } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { deviceName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get devices with user info
    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              email: true,
              userRoles: true,
              activeRole: true,
              lastLoginAt: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              loginLogs: true,
            },
          },
        },
        orderBy: { lastLoginAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.device.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        devices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { deviceId, userId } = await request.json();

    if (!deviceId || !userId) {
      return NextResponse.json(
        { success: false, message: "Device ID and User ID are required" },
        { status: 400 }
      );
    }

    // Admin can force logout any device
    await prisma.device.updateMany({
      where: {
        deviceId,
        userId,
      },
      data: {
        isActive: false,
      },
    });

    // Invalidate all sessions for this device
    await prisma.session.updateMany({
      where: {
        userId,
        device: {
          deviceId,
        },
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Device deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating device:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
