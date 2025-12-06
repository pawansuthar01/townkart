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
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Instead of hard deleting, we'll mark the user as inactive and change their email/phone
    // to prevent reuse and maintain data integrity
    const timestamp = Date.now();
    const deletedEmail = `deleted_${timestamp}_${user.email || "noemail"}`;
    const deletedPhone = `deleted_${timestamp}_${user.phoneNumber}`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: deletedEmail,
        phoneNumber: deletedPhone,
        emailVerified: false,
        phoneVerified: false,
        lastLoginAt: null,
        lastLoginIP: null,
        lastLoginDevice: null,
        // Clear sensitive data
        password: null,
        profileImageUrl: null,
        // Log the deletion reason
        registrationIP: `DELETED: ${reason} - ${user.registrationIP || "unknown"}`,
      },
    });

    // Also deactivate related profiles
    if (user.userRoles.includes("RIDER")) {
      await prisma.riderProfile.updateMany({
        where: { userId },
        data: { isActive: false },
      });
    }

    // Note: We don't deactivate stores as they might have active orders
    // Store managers can be reassigned by admin

    return NextResponse.json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting existing account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
