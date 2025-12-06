import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAccessToken, generateRefreshToken } from "@/lib/auth";
import { verifyOtpSchema } from "@/lib/validation";
import { DeviceManager, LoginContext } from "@/lib/deviceManager";
import { LocationService } from "@/lib/locationService";
import { OTPService } from "@/lib/otpService";
import { UserRole } from "@prisma/client";

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
      console.log(`[VERIFY-OTP] OTP send result:`, result);

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
    const { phoneNumber, otp, deviceInfo, batteryLevel } =
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

      return NextResponse.json({
        success: true,
        message: "Phone number verified successfully",
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
        },
      });
    } else if (otpRecord.purpose === "ACCOUNT_REACTIVATION") {
      // Handle account reactivation for inactive users
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
          { success: false, message: "User not found" },
          { status: 404 }
        );
      }

      // Reactivate the account
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
        },
      });

      user.isActive = true;

      return NextResponse.json({
        success: true,
        message: "Account reactivated successfully",
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
        },
      });
    } else if (otpRecord.purpose === "REGISTER") {
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
            lat: loginContext.locationInfo.lat,
            lng: loginContext.locationInfo.lng,
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

      // Send welcome notification
      await DeviceManager.sendLoginNotification(
        user.id,
        loginContext.deviceInfo,
        loginContext.locationInfo,
        "LOGIN"
      );

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
          registrationIP: true,
          registrationLocation: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found. Please register first." },
          { status: 404 }
        );
      }

      // Validate location if user has registration location
      const locationValidation = await DeviceManager.validateLocation(
        user.id,
        loginContext.locationInfo
      );
      if (!locationValidation.valid) {
        // Get or create device record for logging
        const deviceForLogging = await DeviceManager.getOrCreateDevice(
          user.id,
          loginContext.deviceInfo,
          loginContext.locationInfo
        );

        // Log suspicious login attempt
        await DeviceManager.logDeviceLogin(
          user.id,
          deviceForLogging.id,
          "LOGIN",
          loginContext,
          "HIGH",
          [
            `Login from different location: ${locationValidation.distance?.toFixed(1)}km away from registration location`,
          ]
        );

        return NextResponse.json(
          {
            success: false,
            message: `Login blocked: You are trying to login from a location ${locationValidation.distance?.toFixed(1)}km away from your registration location. Please contact support if this is not you.`,
          },
          { status: 403 }
        );
      }

      // Update phone verification and activation if needed
      if (!user.phoneVerified || !user.isActive) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phoneVerified: true,
            isActive: true,
          },
        });
        user.phoneVerified = true;
        user.isActive = true;
      }

      // Check device login restrictions
      const deviceCheck = await DeviceManager.canLoginFromDevice(
        user.id,
        user.activeRole,
        loginContext.deviceInfo.deviceId
      );

      if (!deviceCheck.allowed) {
        // For riders, return device selection instead of blocking
        if (deviceCheck.requiresDeviceSelection) {
          return NextResponse.json(
            {
              success: false,
              message: deviceCheck.reason,
              existingDevices: deviceCheck.existingDevices,
              requiresDeviceSelection: true,
              action: "SELECT_DEVICE",
            },
            { status: 409 } // Conflict status for device selection
          );
        }

        // Get or create device record for logging
        const deviceForFailedLogging = await DeviceManager.getOrCreateDevice(
          user.id,
          loginContext.deviceInfo,
          loginContext.locationInfo
        );

        // Log failed login attempt for other roles
        await DeviceManager.logDeviceLogin(
          user.id,
          deviceForFailedLogging.id,
          "LOGIN",
          loginContext,
          "HIGH",
          ["Multiple device login attempt blocked"]
        );

        return NextResponse.json(
          {
            success: false,
            message: deviceCheck.reason,
            existingDevices: deviceCheck.existingDevices,
          },
          { status: 403 }
        );
      }

      // For riders, always force logout other devices (single device policy)
      if (user.activeRole === "RIDER") {
        await DeviceManager.forceLogoutOtherDevices(
          user.id,
          loginContext.deviceInfo.deviceId,
          user.activeRole
        );
      } else {
        // For other roles, only logout if they have multiple active devices
        await DeviceManager.forceLogoutOtherDevices(
          user.id,
          loginContext.deviceInfo.deviceId,
          user.activeRole
        );
      }

      // Get or create device record
      const device = await DeviceManager.getOrCreateDevice(
        user.id,
        loginContext.deviceInfo,
        loginContext.locationInfo
      );

      // Log successful login
      await DeviceManager.logDeviceLogin(
        user.id,
        device.id,
        "LOGIN",
        loginContext,
        locationValidation.distance && locationValidation.distance > 10
          ? "MEDIUM"
          : "LOW"
      );

      // Send login notifications
      await DeviceManager.sendLoginNotification(
        user.id,
        loginContext.deviceInfo,
        loginContext.locationInfo,
        "LOGIN"
      );

      // Send admin notification if admin logs in
      if (user.activeRole === "ADMIN") {
        await DeviceManager.sendAdminLoginNotification(
          user.id,
          user.fullName || user.phoneNumber
        );
      }
    }

    // Only create session for LOGIN and REGISTER purposes
    if (
      (otpRecord.purpose === "LOGIN" || otpRecord.purpose === "REGISTER") &&
      user
    ) {
      console.log(
        `Creating session for ${otpRecord.purpose} - user: ${user.id}`
      );

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

      // Update user login info
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIP: loginContext.locationInfo.ip,
          lastLoginDevice: loginContext.deviceInfo.deviceId,
        },
      });

      // Create session with device tracking
      console.log(
        `Creating session for user ${user.id}, device: ${device?.id}`
      );

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          sessionToken: accessToken,
          accessToken,
          refreshToken,
          deviceId: device?.id || null, // Use the actual device record ID, not the fingerprint
          ipAddress: loginContext.locationInfo.ip,
          userAgent: loginContext.userAgent,
          location: {
            country: loginContext.locationInfo.country,
            city: loginContext.locationInfo.city,
            region: loginContext.locationInfo.region,
            lat: loginContext.locationInfo.lat,
            lng: loginContext.locationInfo.lng,
          },
          expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          isActive: true,
        },
      });

      console.log(
        `✅ Session created successfully: ${session.id} for user ${user.id}`
      );
      console.log(
        `Session details: deviceId=${session.deviceId}, ip=${session.ipAddress}`
      );

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
    }

    // For other purposes (PHONE_VERIFICATION, ACCOUNT_REACTIVATION), just return success
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        otpRecord.purpose === "PHONE_VERIFICATION"
          ? "Phone number verified successfully"
          : "Account reactivated successfully",
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
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
