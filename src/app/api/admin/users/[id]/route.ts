import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnlyMiddleware } from "@/middleware/auth.middleware";
import bcrypt from "bcryptjs";

export async function PUT(
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
    const { status, role, storeId, serviceAreaId } = await request.json();

    if (!status || !role) {
      return NextResponse.json(
        { success: false, message: "Status and role are required" },
        { status: 400 }
      );
    }

    // Start a transaction to handle role-specific updates
    const result = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          isActive: status === "ACTIVE",
          activeRole: role as "CUSTOMER" | "STORE_MANAGER" | "RIDER" | "ADMIN",
          userRoles: [role],
        },
      });

      // Handle role-specific assignments
      if (role === "STORE_MANAGER" && storeId) {
        // Update store manager relationship
        await tx.store.update({
          where: { id: storeId },
          data: { managerId: userId },
        });
      } else if (role === "RIDER" && serviceAreaId) {
        // Create rider profile if it doesn't exist
        const riderProfile = await tx.riderProfile.upsert({
          where: { userId },
          update: {
            isActive: true,
            isVerified: false,
          },
          create: {
            userId,
            city: "", // Will be updated based on service area
            isAvailable: false,
            isActive: true,
            isVerified: false,
          },
        });

        // Create rider zone assignment
        await tx.riderZoneAssignment.upsert({
          where: { riderId: riderProfile.id },
          update: {
            serviceAreaId,
            assignedZones: [],
            isCurrentlyValid: true,
            lastValidation: new Date(),
          },
          create: {
            riderId: riderProfile.id,
            serviceAreaId,
            assignedZones: [],
            isCurrentlyValid: true,
            lastValidation: new Date(),
          },
        });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: result.id,
        name: result.fullName,
        email: result.email,
        phone: result.phoneNumber,
        role: result.activeRole,
        status: result.isActive ? "ACTIVE" : "INACTIVE",
      },
    });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
