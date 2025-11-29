import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { RateLimiter } from "@/middleware/rateLimit";
import { OTPService } from "@/lib/otpService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber: identifier } = loginSchema.parse(body);

    // Get client IP for rate limiting
    const clientIP = await RateLimiter.getClientIP(request);
    const userAgent = request.headers.get("user-agent");

    // Check rate limiting
    const rateLimitResult = await RateLimiter.checkLoginAttempts(
      identifier,
      clientIP,
      request,
    );

    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.blockUntil
        ? Math.ceil((rateLimitResult.blockUntil.getTime() - Date.now()) / 1000)
        : undefined;

      return RateLimiter.createRateLimitResponse(
        `Too many login attempts. ${rateLimitResult.remainingAttempts} attempts remaining.`,
        retryAfter,
      );
    }

    // Add progressive delay if needed
    if (rateLimitResult.delayMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, rateLimitResult.delayMs),
      );
    }

    // Check if user exists (by phone or email)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber: identifier }, { email: identifier }],
      },
      select: {
        id: true,
        phoneNumber: true,
        email: true,
        fullName: true,
        userRoles: true,
        activeRole: true,
        phoneVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found. Please register first." },
        { status: 404 },
      );
    }

    // Send OTP using the new service
    const result = await OTPService.sendOTP(
      user.phoneNumber,
      user.email,
      "LOGIN",
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 429 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        phoneNumber: user.phoneNumber,
        otpSent: true,
        channels: result.channels,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);

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
