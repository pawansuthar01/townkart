import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all device limits
    const deviceLimits = await prisma.deviceLimit.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: deviceLimits,
    });
  } catch (error) {
    console.error("Error fetching device limits:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, role, maxDevices } = await request.json();

    if (!maxDevices || maxDevices < 1) {
      return NextResponse.json(
        { success: false, message: "Max devices must be at least 1" },
        { status: 400 }
      );
    }

    if (!userId && !role) {
      return NextResponse.json(
        { success: false, message: "Either userId or role must be provided" },
        { status: 400 }
      );
    }

    if (userId && role) {
      return NextResponse.json(
        { success: false, message: "Cannot specify both userId and role" },
        { status: 400 }
      );
    }

    // Check if limit already exists
    const existingLimit = await prisma.deviceLimit.findFirst({
      where: userId ? { userId } : { role: role as UserRole },
    });

    if (existingLimit) {
      // Update existing limit
      const updatedLimit = await prisma.deviceLimit.update({
        where: { id: existingLimit.id },
        data: {
          maxDevices,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Device limit updated successfully",
        data: updatedLimit,
      });
    } else {
      // Create new limit
      const newLimit = await prisma.deviceLimit.create({
        data: {
          userId: userId || null,
          role: role ? (role as UserRole) : null,
          maxDevices,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Device limit created successfully",
        data: newLimit,
      });
    }
  } catch (error) {
    console.error("Error creating/updating device limit:", error);
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

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Device limit ID is required" },
        { status: 400 }
      );
    }

    // Deactivate the device limit instead of deleting
    await prisma.deviceLimit.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Device limit deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating device limit:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
