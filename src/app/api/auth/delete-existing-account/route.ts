import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId, reason } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        userRoles: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "User is already inactive" },
        { status: 400 }
      );
    }

    // Start a transaction to delete all related data
    await prisma.$transaction(async (tx) => {
      // Delete role-specific data first
      if (user.userRoles.includes("RIDER")) {
        // Delete rider profile and related data
        await tx.riderProfile.deleteMany({
          where: { userId },
        });

        // Delete rider zone assignments
        await tx.riderZoneAssignment.deleteMany({
          where: { riderId: userId },
        });
      }

      if (user.userRoles.includes("STORE_MANAGER")) {
        // Remove store manager assignment
        await tx.store.updateMany({
          where: { managerId: userId },
          data: { managerId: null },
        });
      }

      if (user.userRoles.includes("CUSTOMER")) {
        // Delete customer addresses
        await tx.address.deleteMany({
          where: { userId },
        });

        // Delete wishlist items
        await tx.wishlistItem.deleteMany({
          where: { userId },
        });
      }

      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId },
      });

      // Delete orders (if any) - this will cascade delete related data
      await tx.order.deleteMany({
        where: { customerId: userId },
      });

      // Delete device sessions
      await tx.device.deleteMany({
        where: { userId },
      });

      // Delete sessions
      await tx.session.deleteMany({
        where: { userId },
      });

      // Finally, soft delete the user (mark as inactive)
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `${user.email}_deleted_${Date.now()}`, // Prevent email conflicts
          phoneNumber: `${user.phoneNumber}_deleted_${Date.now()}`, // Prevent phone conflicts
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting existing account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
