import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnlyMiddleware } from "@/middleware/auth.middleware";

export async function POST(
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

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Invalidate all active sessions for this user
    await prisma.session.updateMany({
      where: {
        userId: userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Log the logout action
    console.log(`Admin logged out user ${userId} from all devices`);

    return NextResponse.json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Admin logout user error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to logout user" },
      { status: 500 }
    );
  }
}
