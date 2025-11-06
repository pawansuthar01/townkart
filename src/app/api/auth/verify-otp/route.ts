import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { verifyOtpSchema } from "@/lib/validation";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, otp } = verifyOtpSchema.parse(body);

    // Find the OTP record
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phoneNumber,
        otp,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    let user;
    let isNewUser = false;

    if (otpRecord.purpose === "REGISTER") {
      // Find the user created during registration
      user = await prisma.user.findUnique({
        where: { phoneNumber },
        select: {
          id: true,
          phoneNumber: true,
          fullName: true,
          email: true,
          userRoles: true,
          activeRole: true,
          phoneVerified: true,
          isActive: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found. Please register again." },
          { status: 404 },
        );
      }

      // Activate the user and verify phone
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          isActive: true,
        },
      });

      isNewUser = true;
    } else if (otpRecord.purpose === "LOGIN") {
      // Find existing user
      user = await prisma.user.findUnique({
        where: { phoneNumber },
        select: {
          id: true,
          phoneNumber: true,
          fullName: true,
          email: true,
          userRoles: true,
          activeRole: true,
          phoneVerified: true,
          isActive: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found. Please register first." },
          { status: 404 },
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          {
            success: false,
            message: "Account is deactivated. Please contact support.",
          },
          { status: 403 },
        );
      }
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      phoneNumber: user.phoneNumber,
      activeRole: user.activeRole,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      phoneNumber: user.phoneNumber,
    });

    // Clean up expired OTPs for this phone number
    await prisma.oTP.deleteMany({
      where: {
        phoneNumber,
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: isNewUser
        ? "Registration completed successfully"
        : "Login successful",
      data: {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          fullName: user.fullName,
          email: user.email,
          userRoles: user.userRoles,
          activeRole: user.activeRole,
          phoneVerified: user.phoneVerified,
          isActive: user.isActive,
        },
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
      },
    });
  } catch (error: any) {
    console.error("OTP verification error:", error);

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input data",
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
