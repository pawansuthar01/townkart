import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { prisma } from "@/lib/prisma";
import { OTPService } from "@/lib/otpService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, phoneNumber, role } =
      registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      const conflictField =
        existingUser.email === email ? "email" : "phone number";
      return NextResponse.json(
        {
          success: false,
          message: `User with this ${conflictField} already exists. Please use a different ${conflictField} or try logging in.`,
        },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (inactive until OTP verification)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword, // Add the hashed password
        fullName,
        phoneNumber,
        userRoles: [role.toUpperCase() as any],
        activeRole: role.toUpperCase() as any,
        phoneVerified: false,
        emailVerified: false,
        isActive: false, // Will be activated after OTP verification
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        userRoles: true,
        activeRole: true,
      },
    });

    // Send OTP using the new service
    const result = await OTPService.sendOTP(phoneNumber, email, "REGISTER");

    if (!result.success) {
      // Delete the created user if OTP sending failed
      await prisma.user.delete({
        where: { id: user.id },
      });

      return NextResponse.json(
        { success: false, message: result.message },
        { status: 429 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        userId: user.id,
        phoneNumber,
        otpSent: true,
        channels: result.channels,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);

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
