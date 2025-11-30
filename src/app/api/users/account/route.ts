import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start a transaction to delete user and related data
    await prisma.$transaction(async (tx) => {
      // Delete related data first due to foreign key constraints

      // Delete customer profile if exists
      await tx.customerProfile.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete rider profile if exists
      await tx.riderProfile.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete addresses
      await tx.address.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete devices
      await tx.device.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete login attempts
      await tx.loginAttempt.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete orders (cascade will handle order items)
      await tx.order.deleteMany({
        where: { customerId: session.user.id },
      });

      // Delete wishlist items
      await tx.wishlistItem.deleteMany({
        where: { userId: session.user.id },
      });

      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId: session.user.id },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: session.user.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete account" },
      { status: 500 }
    );
  }
}
