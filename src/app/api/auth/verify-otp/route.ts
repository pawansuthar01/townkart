import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/lib/validation";
import { DeviceManager, LoginContext } from "@/lib/deviceManager";
import { LocationService } from "@/lib/locationService";
import { OTPService } from "@/lib/otpService";
import { UserRole } from "@prisma/client";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { userInfo } from "os";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a send OTP request
    if (body.action === "send") {
      console.log(`[VERIFY-OTP] Send action requested for ${body.phoneNumber}`);
      const { phoneNumber, purpose = "LOGIN" } = body;

      if (!phoneNumber) {
        return NextResponse.json(
          { success: false, message: "Phone number is required" },
          { status: 400 }
        );
      }

      // Find user to get email for OTP delivery
      const user = await prisma.user.findUnique({
        where: { phoneNumber },
        select: { email: true },
      });
      console.log(
        `[VERIFY-OTP] User lookup result:`,
        user ? `Found user with email: ${user.email}` : "User not found"
      );

      const result = await OTPService.sendOTP(
        phoneNumber,
        user?.email || null,
        purpose as any
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: result.message,
          channels: result.channels,
        });
      } else {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: 400 }
        );
      }
    }

    // Handle OTP verification
    const { phoneNumber, otp, deviceInfo, batteryLevel, logoutDevices } =
      verifyOtpSchema.parse(body);

    // Get client information
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "";

    // Parse device info from request
    const parsedUA = (LocationService as any).parseUserAgent(userAgent);
    const deviceData = {
      deviceId: deviceInfo?.deviceId || "unknown",
      deviceName: deviceInfo?.deviceName,
      deviceType: deviceInfo?.deviceType || parsedUA.deviceType,
      os: deviceInfo?.os || parsedUA.os,
      browser: deviceInfo?.browser || parsedUA.browser,
      fingerprint: deviceInfo?.fingerprint,
      batteryLevel: batteryLevel,
    };

    // Get location information
    const locationInfo = await LocationService.getLocationInfoFromIP(clientIP);

    const loginContext: LoginContext = {
      deviceInfo: deviceData,
      locationInfo,
      userAgent,
    };

    // Find the OTP record first to get the purpose
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
        { status: 400 }
      );
    }

    // Verify OTP using the new service (this will mark it as used)
    const isValidOTP = await OTPService.verifyOTP(phoneNumber, otp);

    if (!isValidOTP) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    let user: any = null;
    let device: any = null;
    let isNewUser = false;

    if (otpRecord.purpose === "PHONE_VERIFICATION") {
      // Handle phone verification for authenticated users
      user = await prisma.user.findUnique({
        where: { phoneNumber },
        include: {
          riderProfile: true,
          managedStores: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      // Update phone verification status
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          isActive: true,
        },
      });

      user.phoneVerified = true;
      user.isActive = true;

      return NextResponse.json({
        success: true,
        message: "Phone number verified successfully",
        userInfo: {
          ...user,
          storeId: user.managedStores?.[0]?.id || null,
          riderId: user.riderProfile?.id || null,
          riderProfile: user.riderProfile,
        },
      });
    } else if (otpRecord.purpose === "ACCOUNT_ACTIVATION") {
      // Handle account reactivation for inactive users
      user = await prisma.user.findUnique({
        where: { phoneNumber },
        include: {
          riderProfile: true,
          managedStores: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          isActive: true,
        },
      });
      user.phoneVerified = true;
      user.isActive = true;

      // Reactivate the user account
      return NextResponse.json({
        success: true,
        message: "Account reactivated successfully",
        userInfo: {
          ...user,
          storeId: user.managedStores?.[0]?.id || null,
          riderId: user.riderProfile?.id || null,
          riderProfile: user.riderProfile,
        },
      });
    } else if (otpRecord.purpose === "REGISTER") {
      // Find the user created during registration
      user = await prisma.user.findUnique({
        where: { phoneNumber },
        include: {
          riderProfile: true,
          managedStores: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found. Please register again." },
          { status: 404 }
        );
      }

      // Activate the user and verify phone, store registration location
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          isActive: true,
          registrationIP: loginContext.locationInfo.ip,
          registrationLocation: {
            country: loginContext.locationInfo.country,
            city: loginContext.locationInfo.city,
            region: loginContext.locationInfo.region,
            lat: loginContext.locationInfo.latitude,
            lng: loginContext.locationInfo.longitude,
          },
        },
      });

      // Get or create device record for new user
      const device = await DeviceManager.getOrCreateDevice(
        user.id,
        loginContext.deviceInfo,
        loginContext.locationInfo
      );

      // Log registration/login
      await DeviceManager.logDeviceLogin(
        user.id,
        device.id,
        "LOGIN",
        loginContext,
        "LOW",
        ["First login after registration"]
      );
      user.isActive = true;
      user.phoneVerified = true;
      // Send welcome notification
      await DeviceManager.sendLoginNotification(
        user.id,
        loginContext.deviceInfo,
        loginContext.locationInfo,
        "LOGIN"
      );

      return NextResponse.json({
        success: true,
        message: "Account register successfully",
        userInfo: {
          ...user,
          storeId: user.managedStores?.[0]?.id || null,
          riderId: user.riderProfile?.id || null,
          riderProfile: user.riderProfile,
        },
      });
    } else if (otpRecord.purpose === "LOGIN") {
      // Find existing user
      user = await prisma.user.findUnique({
        where: { phoneNumber },
        include: {
          riderProfile: true,
          managedStores: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found. Please register first." },
          { status: 404 }
        );
      }

      // Handle device logout if requested
      if (logoutDevices && logoutDevices.length > 0) {
        for (const deviceId of logoutDevices) {
          await DeviceManager.deactivateDevice(user.id, deviceId);
        }
      }

      // Check device limit before proceeding with login
      const deviceCheck = await DeviceManager.canLoginFromDevice(
        user.id,
        user.activeRole,
        deviceData.deviceId
      );

      if (!deviceCheck.allowed) {
        return NextResponse.json(
          {
            success: true, // OTP was verified successfully
            otpVerified: true,
            allowed: deviceCheck.allowed,
            reason: deviceCheck.reason,
            existingDevices: deviceCheck.existingDevices,
            requiresDeviceSelection: deviceCheck.requiresDeviceSelection,
            userInfo: user,
          },
          { status: 200 }
        );
      }

      // Update phone verification and activation if needed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phoneVerified: true,
          isActive: true,
          lastLoginAt: new Date(),
          lastLoginIP: loginContext.locationInfo.ip,
          lastLoginDevice: loginContext.deviceInfo.deviceId,
        },
      });
      user.phoneVerified = true;
      user.isActive = true;
      return NextResponse.json({
        success: true,
        message: "Account login successfully",
        userInfo: {
          ...user,
          storeId: user.managedStores?.[0]?.id || null,
          riderId: user.riderProfile?.id || null,
          riderProfile: user.riderProfile,
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        otpRecord.purpose === "LOGIN"
          ? "Login successful"
          : otpRecord.purpose === "REGISTER"
            ? "Registration completed successfully"
            : otpRecord.purpose === "PHONE_VERIFICATION"
              ? "Phone number verified successfully"
              : "Account reactivated successfully",
      userInfo: user
        ? {
            ...user,
            storeId: user.managedStores?.[0]?.id || null,
            riderId: user.riderProfile?.id || null,
            riderProfile: user.riderProfile,
          }
        : null,
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
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
