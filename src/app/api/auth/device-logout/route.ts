import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeviceTracker } from "@/middleware/deviceTracking";
import { DeviceManager } from "@/lib/deviceManager";

export async function POST(request: NextRequest) {
  try {
    const { deviceIds, userId } = await request.json();
    if (
      !deviceIds ||
      !Array.isArray(deviceIds) ||
      deviceIds.length === 0 ||
      !userId
    ) {
      return NextResponse.json(
        { success: false, message: "Device IDs and user ID are required" },
        { status: 400 }
      );
    }

    // Verify that all devices belong to the user
    const devices = await prisma.device.findMany({
      where: {
        id: { in: deviceIds },
        userId,
        isActive: true,
      },
    });

    if (devices.length !== deviceIds.length) {
      return NextResponse.json(
        { success: false, message: "Some devices not found or not active" },
        { status: 404 }
      );
    }

    // Deactivate devices
    for (const deviceId of deviceIds) {
      await DeviceManager.deactivateDevice(userId, deviceId);
    }

    // Verify devices are actually deactivated
    const verifiedDevices = await prisma.device.findMany({
      where: {
        id: { in: deviceIds },
        userId,
        isActive: false, // Should be inactive now
      },
      select: { id: true },
    });

    const successfullyLoggedOut = verifiedDevices.length;
    const failedToLogout = deviceIds.length - successfullyLoggedOut;

    // Log the device logout
    for (const device of devices) {
      await DeviceTracker.logDeviceLogin(
        userId,
        device.id, // Use device.id (primary key) not device.deviceId (fingerprint)
        "DEVICE_LOGOUT",
        {
          deviceInfo: {
            deviceId: device.deviceId,
            deviceType: device.deviceType,
          },
          locationInfo: {
            ip: device.lastIP || "unknown",
            ...(device.lastLocation as any),
          },
          userAgent: "unknown",
        },
        "LOW",
        ["User manually logged out device during login"]
      );
    }

    return NextResponse.json({
      success: failedToLogout === 0, // Only success if all devices were logged out
      message:
        failedToLogout === 0
          ? `Successfully logged out ${successfullyLoggedOut} device(s)`
          : `Failed to logout ${failedToLogout} device(s). ${successfullyLoggedOut} device(s) logged out successfully.`,
      data: {
        loggedOutDevices: successfullyLoggedOut,
        failedToLogout,
        totalRequested: deviceIds.length,
      },
    });
  } catch (error: any) {
    console.error("Device logout error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
