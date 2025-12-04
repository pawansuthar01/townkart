import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeviceManager } from "@/lib/deviceManager";
import { OTPService } from "@/lib/otpService";
import { RateLimiter } from "@/middleware/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Basic rate limiting - check recent device logout attempts
    const recentLogouts = await prisma.deviceLoginLog.count({
      where: {
        userId: session.user.id,
        loginType: "DEVICE_LOGOUT",
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    if (recentLogouts >= 3) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many device logout attempts. Please wait 5 minutes before trying again.",
        },
        { status: 429 }
      );
    }

    const { action, deviceId, otp, phoneNumber } = await request.json();

    if (action === "request_otp") {
      // Send OTP for device logout verification
      if (!deviceId) {
        return NextResponse.json(
          { success: false, message: "Device ID is required" },
          { status: 400 }
        );
      }

      // Get current device ID from the session
      const currentDeviceId = (session as any)?.deviceId;

      // Don't allow logging out the current device
      if (currentDeviceId === deviceId) {
        return NextResponse.json(
          { success: false, message: "Cannot logout the current device" },
          { status: 400 }
        );
      }

      const device = await prisma.device.findFirst({
        where: {
          userId: session.user.id,
          deviceId,
          isActive: true,
        },
      });

      if (!device) {
        return NextResponse.json(
          { success: false, message: "Device not found or not active" },
          { status: 404 }
        );
      }

      // Get user phone number
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { phoneNumber: true, email: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      // Send OTP for device logout verification
      const result = await OTPService.sendOTP(
        user.phoneNumber,
        user.email,
        "DEVICE_LOGOUT"
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        deviceId,
        channels: result.channels,
      });
    } else if (action === "verify_otp") {
      // Verify OTP and logout device
      if (!deviceId || !otp || !phoneNumber) {
        return NextResponse.json(
          {
            success: false,
            message: "Device ID, OTP, and phone number are required",
          },
          { status: 400 }
        );
      }

      // Verify OTP
      const isValidOTP = await OTPService.verifyOTP(phoneNumber, otp);
      if (!isValidOTP) {
        return NextResponse.json(
          { success: false, message: "Invalid or expired OTP" },
          { status: 400 }
        );
      }

      // Verify the device belongs to the user
      const device = await prisma.device.findFirst({
        where: {
          userId: session.user.id,
          deviceId,
          isActive: true,
        },
      });

      if (!device) {
        return NextResponse.json(
          { success: false, message: "Device not found or not active" },
          { status: 404 }
        );
      }

      // Logout the selected device
      await DeviceManager.deactivateDevice(session.user.id, deviceId);

      // Log the device logout operation
      await DeviceManager.logDeviceLogin(
        session.user.id,
        deviceId,
        "DEVICE_LOGOUT",
        {
          deviceInfo: { deviceId, deviceType: "unknown" },
          locationInfo: { ip: "unknown" },
          userAgent: request.headers.get("user-agent") || "",
        },
        "LOW",
        ["Device manually logged out via OTP verification"]
      );

      // Clean up expired OTPs
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
        message: "Device logged out successfully",
        loggedOutDeviceId: deviceId,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Device logout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
