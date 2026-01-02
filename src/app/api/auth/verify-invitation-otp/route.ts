import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OTPService } from "@/lib/otpService";

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { success: false, message: "User ID and OTP are required" },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        phoneVerified: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Verify OTP
    const isValidOTP = await OTPService.verifyOTP(user.phoneNumber!, otp);

    if (!isValidOTP) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Update user verification status
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        emailVerified: true, // Email is pre-verified from invitation
        isActive: true, // Activate the account
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Phone number verified successfully. Your account is now active.",
    });
  } catch (error) {
    console.error("Error verifying invitation OTP:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
