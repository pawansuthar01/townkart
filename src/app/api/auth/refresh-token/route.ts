import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "Refresh token is required" },
        { status: 400 },
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid refresh token" },
        { status: 401 },
      );
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        phoneNumber: true,
        activeRole: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "User not found or inactive" },
        { status: 401 },
      );
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      phoneNumber: user.phoneNumber,
      activeRole: user.activeRole,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      phoneNumber: user.phoneNumber,
    });

    return NextResponse.json({
      success: true,
      message: "Tokens refreshed successfully",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60, // 15 minutes
      },
    });
  } catch (error: any) {
    console.error("Refresh token error:", error);

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
