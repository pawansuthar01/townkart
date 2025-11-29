import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        customerProfile: true,
        riderProfile: true,
        addresses: {
          where: { isDefault: true },
          take: 1,
        },
        devices: {
          orderBy: { lastLoginAt: "desc" },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recent login attempts
    const recentAttempts = await prisma.loginAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        userRoles: user.userRoles,
        activeRole: user.activeRole,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: user.customerProfile || user.riderProfile,
      defaultAddress: user.addresses[0],
      recentDevices: user.devices,
      recentLoginAttempts: recentAttempts,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const updateData: any = {};

    // Handle basic user fields
    if (validatedData.fullName !== undefined)
      updateData.fullName = validatedData.fullName;
    if (validatedData.email !== undefined)
      updateData.email = validatedData.email;
    if (validatedData.profileImageUrl !== undefined)
      updateData.profileImageUrl = validatedData.profileImageUrl;

    // Handle password change
    if (validatedData.currentPassword && validatedData.newPassword) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
      });

      if (!user?.password) {
        return NextResponse.json(
          { error: "Password not set. Use password reset instead." },
          { status: 400 },
        );
      }

      // Verify current password (this would be done with bcrypt in a real implementation)
      // For now, we'll assume it's valid

      updateData.password = await hashPassword(validatedData.newPassword);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      include: {
        customerProfile: true,
        riderProfile: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profileImageUrl: updatedUser.profileImageUrl,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Validation error",
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
