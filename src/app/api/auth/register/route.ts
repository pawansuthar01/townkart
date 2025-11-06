import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPassword, generateOTP } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

const prisma = new PrismaClient();

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
      return NextResponse.json(
        {
          success: false,
          message: "User with this email or phone number already exists",
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

    // Generate OTP for phone verification
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.oTP.create({
      data: {
        phoneNumber,
        otp,
        purpose: "REGISTER",
        expiresAt,
      },
    });

    // In production, send OTP via SMS
    console.log(`Registration OTP for ${phoneNumber}: ${otp}`);

    return NextResponse.json({
      success: true,
      message:
        "Registration initiated. Please verify your phone number with the OTP sent.",
      data: {
        userId: user.id,
        phoneNumber,
        otpSent: true,
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
