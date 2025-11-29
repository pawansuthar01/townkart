import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RateLimiter } from "@/middleware/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { attemptId } = await request.json();

    if (!attemptId) {
      return NextResponse.json(
        { success: false, message: "Attempt ID required" },
        { status: 400 },
      );
    }

    // Get client information
    const ipAddress = await RateLimiter.getClientIP(request);
    const userAgent = request.headers.get("user-agent");

    // Update the login attempt with proper device information
    await prisma.loginAttempt.update({
      where: { id: attemptId },
      data: {
        ipAddress,
        userAgent: userAgent || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Login attempt updated successfully",
    });
  } catch (error) {
    console.error("Update login attempt error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
