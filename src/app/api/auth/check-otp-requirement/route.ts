import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { RateLimiter } from "@/middleware/rateLimit";
import LocationService from "@/lib/locationService";
import { DeviceManager } from "@/lib/deviceManager";
import { DeviceTracker } from "@/middleware/deviceTracking";
import { convertSeconds } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    const ip = await RateLimiter.getClientIP(request);

    const ua = request.headers.get("user-agent") || "unknown";

    const locationInfo = await LocationService.getLocationInfoFromIP(ip);

    const parsedUA = LocationService.parseUserAgent(ua);
    /* -------- RATE LIMIT -------- */
    const rate = await RateLimiter.checkLoginAttempts(identifier, ip);
    if (!rate.allowed) {
      await RateLimiter.recordLoginAttempt(
        identifier,
        ip,
        ua,
        false,
        "RATE_LIMIT"
      );
      return NextResponse.json(
        {
          success: false,
          message: `To Many Login Attempts. Please try again in ${convertSeconds(rate.Ws)}.`,
        },
        { status: 429 }
      );
    }

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Identifier and password are required" },
        { status: 400 }
      );
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
      },
      include: {
        riderProfile: true,
        managedStores: true,
      },
    });

    if (!user || !user.password) {
      await RateLimiter.recordLoginAttempt(
        identifier,
        ip,
        ua,
        false,
        "INVALID_CREDENTIALS"
      );
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      await RateLimiter.recordLoginAttempt(
        identifier,
        ip,
        ua,
        false,
        "INVALID_PASSWORD",
        user.id
      );
      return NextResponse.json(
        {
          success: false,
          message: "Your password is invalid try again...",
        },
        { status: 403 }
      );
    }
    await RateLimiter.recordLoginAttempt(
      identifier,
      ip,
      ua,
      true,
      undefined,
      user.id
    );

    if (!user.isActive) {
      // For inactive accounts, always allow phone verification for reactivation
      if (!user.phoneVerified) {
        return NextResponse.json({
          success: true,
          requiresPhoneVerification: true,
          purpose: "ACCOUNT_ACTIVATION",
          userId: user.id,
          phoneNumber: user.phoneNumber,
          message: user.phoneVerified
            ? "Account is inactive. Please verify your phone number to reactivate."
            : "Account is inactive. Please verify your phone number to reactivate.",
        });
      }
      return NextResponse.json(
        {
          success: false,
          message: "your account is inactive please contact support !",
        },
        { status: 403 }
      );
    }

    // Check if phone is verified for active accounts
    if (!user.phoneVerified) {
      // Phone not verified - need to verify
      return NextResponse.json({
        success: true,
        requiresPhoneVerification: true,
        purpose: "PHONE_VERIFICATION",
        userId: user.id,
        phoneNumber: user.phoneNumber,
        message: "Please verify your phone number to continue.",
      });
    }

    // Determine if OTP is required for login
    const requiresOTP =
      user.activeRole === "ADMIN" ||
      user.activeRole === "RIDER" ||
      user.activeRole === "STORE_MANAGER" ||
      (user.activeRole === "CUSTOMER" && user.twoFactorEnabled === true);

    // If no OTP required, check device limits
    if (!requiresOTP) {
      const deviceId = DeviceTracker.generateDeviceFingerprint(request as any);
      const deviceCheck = await DeviceManager.canLoginFromDevice(
        user.id,
        user.activeRole,
        deviceId
      );
      if (!deviceCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            userInfo: user,
            allowed: deviceCheck.allowed,
            reason: deviceCheck.reason,
            existingDevices: deviceCheck.existingDevices,
            requiresDeviceSelection: deviceCheck.requiresDeviceSelection,
            message:
              "Maximum device limit reached. Please logout from other devices first.  than login again.",
          },
          { status: 200 }
        );
      }
    }

    const response = {
      success: true,
      status: 200,
      requiresOTP,
      userInfo: {
        ...user,
        storeId: user.managedStores?.[0]?.id || null,
        riderId: user.riderProfile?.id || null,
        riderProfile: user.riderProfile,
      },
      userId: user.id,
      phoneNumber: user.phoneNumber,
      activeRole: user.activeRole,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Check OTP requirement error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
