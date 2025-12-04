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
    const { fullName, email, phoneNumber, role } = await request.json();

    if (!fullName || !email || !phoneNumber || !role) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if email/phone is already used by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Email or phone already used by another user",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        email,
        phoneNumber,
        activeRole: role as "CUSTOMER" | "STORE_MANAGER" | "RIDER" | "ADMIN",
        userRoles: [role],
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        role: user.activeRole,
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
