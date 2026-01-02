import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
        phoneVerified: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: user,
        twoFactorStatus: {
          enabled: user.twoFactorEnabled,
          method: user.twoFactorMethod,
          phoneVerified: user.phoneVerified,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching 2FA status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = params.id;
    const { enabled, method } = await request.json();

    // Validate method if enabling 2FA
    if (enabled && !["SMS", "EMAIL", "APP"].includes(method)) {
      return NextResponse.json(
        { success: false, message: "Invalid 2FA method" },
        { status: 400 }
      );
    }

    // Check if user has verified contact method for chosen 2FA method
    if (enabled) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          phoneVerified: true,
          emailVerified: true,
        },
      });

      if (method === "SMS" && !user?.phoneVerified) {
        return NextResponse.json(
          {
            success: false,
            message: "User must have verified phone number for SMS 2FA",
          },
          { status: 400 }
        );
      }

      if (method === "EMAIL" && !user?.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            message: "User must have verified email for email 2FA",
          },
          { status: 400 }
        );
      }
    }

    // Update 2FA settings
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: enabled,
        twoFactorMethod: enabled ? method : null,
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorMethod: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `2FA ${enabled ? "enabled" : "disabled"} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating 2FA settings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
