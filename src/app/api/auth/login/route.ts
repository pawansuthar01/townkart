import { NextRequest, NextResponse } from "next/server";
import { signIn } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import { DeviceTracker, LoginContext } from "@/middleware/deviceTracking";
import { LocationService } from "@/lib/locationService";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, deviceInfo } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Get client information
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-client-ip") ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    // Parse device info
    const parsedDeviceInfo = {
      deviceId:
        deviceInfo?.deviceId ||
        DeviceTracker.generateDeviceFingerprint(request),
      deviceName: deviceInfo?.deviceName,
      deviceType:
        deviceInfo?.deviceType || DeviceTracker.getDeviceType(userAgent),
      os: deviceInfo?.os || DeviceTracker.getOS(userAgent),
      browser: deviceInfo?.browser || DeviceTracker.getBrowser(userAgent),
      fingerprint: deviceInfo?.fingerprint,
      batteryLevel: deviceInfo?.batteryLevel,
    };

    // Get location information
    const locationInfo = await LocationService.getLocationInfoFromIP(clientIP);

    const loginContext: LoginContext = {
      deviceInfo: parsedDeviceInfo,
      locationInfo,
      userAgent,
    };

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        isActive: true,
        phoneVerified: true,
      },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found. Please register first." },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is deactivated. Please contact support.",
        },
        { status: 403 }
      );
    }

    if (!user.phoneVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone number not verified. Please verify first.",
        },
        { status: 403 }
      );
    }

    // Log the login attempt
    await DeviceTracker.logDeviceLogin(
      user.id,
      parsedDeviceInfo.deviceId,
      "LOGIN_ATTEMPT",
      loginContext,
      "LOW",
      ["OTP login initiated"]
    );

    return NextResponse.json({
      success: true,
      message: "Login initiated. Please verify OTP.",
      userId: user.id,
      deviceInfo: parsedDeviceInfo,
    });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
