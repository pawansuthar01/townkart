import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  os?: string;
  browser?: string;
  fingerprint?: string;
  batteryLevel?: number;
}

export interface LocationInfo {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  lat?: number;
  lng?: number;
}

export interface LoginContext {
  deviceInfo: DeviceInfo;
  locationInfo: LocationInfo;
  userAgent: string;
}

export class DeviceManager {
  /**
   * Get or create device record
   */
  static async getOrCreateDevice(
    userId: string,
    deviceInfo: DeviceInfo,
    locationInfo: LocationInfo
  ) {
    let device = await prisma.device.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId: deviceInfo.deviceId,
        },
      },
    });

    if (!device) {
      device = await prisma.device.create({
        data: {
          userId,
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          fingerprint: deviceInfo.fingerprint,
          lastIP: locationInfo.ip,
          lastLocation: {
            country: locationInfo.country,
            city: locationInfo.city,
            region: locationInfo.region,
            lat: locationInfo.lat,
            lng: locationInfo.lng,
          },
          batteryLevel: deviceInfo.batteryLevel,
          lastBatteryUpdate: deviceInfo.batteryLevel ? new Date() : undefined,
        },
      });
    } else {
      // Update device info
      device = await prisma.device.update({
        where: { id: device.id },
        data: {
          deviceName: deviceInfo.deviceName || device.deviceName,
          os: deviceInfo.os || device.os,
          browser: deviceInfo.browser || device.browser,
          fingerprint: deviceInfo.fingerprint || device.fingerprint,
          lastIP: locationInfo.ip,
          lastLocation: {
            country: locationInfo.country,
            city: locationInfo.city,
            region: locationInfo.region,
            lat: locationInfo.lat,
            lng: locationInfo.lng,
          },
          batteryLevel: deviceInfo.batteryLevel,
          lastBatteryUpdate: deviceInfo.batteryLevel ? new Date() : undefined,
          loginCount: { increment: 1 },
          lastLoginAt: new Date(),
        },
      });
    }

    return device;
  }

  /**
   * Check if user can login from this device based on role restrictions
   */
  static async canLoginFromDevice(
    userId: string,
    userRole: string,
    deviceId: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    existingDevices?: any[];
    requiresDeviceSelection?: boolean;
  }> {
    // Customers can login from multiple devices
    if (userRole === "CUSTOMER") {
      return { allowed: true };
    }

    // For riders - strict single device policy
    if (userRole === "RIDER") {
      const activeDevices = await prisma.device.findMany({
        where: {
          userId,
          isActive: true,
          deviceId: { not: deviceId }, // Exclude current device
        },
        select: {
          id: true,
          deviceId: true,
          deviceName: true,
          deviceType: true,
          os: true,
          browser: true,
          lastLoginAt: true,
          lastIP: true,
          lastLocation: true,
          batteryLevel: true,
        },
        orderBy: { lastLoginAt: "desc" },
      });

      if (activeDevices.length > 0) {
        return {
          allowed: false,
          reason: `You are already logged in from another device. Please select which device to logout from to continue.`,
          existingDevices: activeDevices,
          requiresDeviceSelection: true,
        };
      }
    }

    // For admins, stores - check if any other device is active
    const activeDevices = await prisma.device.findMany({
      where: {
        userId,
        isActive: true,
        deviceId: { not: deviceId }, // Exclude current device
      },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        deviceType: true,
        lastLoginAt: true,
        lastIP: true,
        lastLocation: true,
      },
    });

    if (activeDevices.length > 0) {
      return {
        allowed: false,
        reason: `You can only be logged in from one device at a time. Please logout from other devices first.`,
        existingDevices: activeDevices,
      };
    }

    return { allowed: true };
  }

  /**
   * Validate login location against registration location
   */
  static async validateLocation(
    userId: string,
    currentLocation: LocationInfo
  ): Promise<{
    valid: boolean;
    distance?: number;
    registrationLocation?: any;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        registrationLocation: true,
      },
    });

    if (!user?.registrationLocation) {
      // No registration location stored, allow login
      return { valid: true };
    }

    const regLocation = user.registrationLocation as any;
    if (
      !currentLocation.lat ||
      !currentLocation.lng ||
      !regLocation.lat ||
      !regLocation.lng
    ) {
      // Can't calculate distance, allow login
      return { valid: true };
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      regLocation.lat,
      regLocation.lng,
      currentLocation.lat,
      currentLocation.lng
    );

    // Allow login if within 50km of registration location
    const maxDistance = 50; // km
    return {
      valid: distance <= maxDistance,
      distance,
      registrationLocation: regLocation,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Log device login activity
   */
  static async logDeviceLogin(
    userId: string,
    deviceId: string,
    loginType: string,
    context: LoginContext,
    riskLevel: string = "LOW",
    riskReasons?: string[]
  ) {
    await prisma.deviceLoginLog.create({
      data: {
        userId,
        deviceId,
        loginType,
        ipAddress: context.locationInfo.ip,
        userAgent: context.userAgent,
        location: {
          country: context.locationInfo.country,
          city: context.locationInfo.city,
          region: context.locationInfo.region,
          lat: context.locationInfo.lat,
          lng: context.locationInfo.lng,
        },
        batteryLevel: context.deviceInfo.batteryLevel,
        deviceType: context.deviceInfo.deviceType,
        isSuspicious: riskLevel !== "LOW",
        riskLevel,
        riskReasons: riskReasons ? { reasons: riskReasons } : undefined,
      },
    });
  }

  /**
   * Force logout from all other devices for restricted roles
   */
  static async forceLogoutOtherDevices(
    userId: string,
    currentDeviceId: string,
    userRole: string
  ) {
    if (userRole === "CUSTOMER") return; // Customers can stay logged in on multiple devices

    // Invalidate all sessions for other devices
    await prisma.session.updateMany({
      where: {
        userId,
        device: {
          deviceId: { not: currentDeviceId },
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Mark other devices as inactive
    await prisma.device.updateMany({
      where: {
        userId,
        deviceId: { not: currentDeviceId },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Send system notification for login events
   */
  static async sendLoginNotification(
    userId: string,
    deviceInfo: DeviceInfo,
    locationInfo: LocationInfo,
    notificationType: "LOGIN" | "LOGOUT" | "NEW_DEVICE" | "LOCATION_CHANGE"
  ) {
    let title = "";
    let message = "";

    switch (notificationType) {
      case "LOGIN":
        title = "New Login Detected";
        message = `You logged in from ${deviceInfo.deviceType} in ${locationInfo.city || "Unknown location"}`;
        break;
      case "NEW_DEVICE":
        title = "New Device Login";
        message = `A new ${deviceInfo.deviceType} device logged into your account from ${locationInfo.city || "Unknown location"}`;
        break;
      case "LOCATION_CHANGE":
        title = "Login from Different Location";
        message = `Login detected from ${locationInfo.city || "Unknown location"}, different from your usual location`;
        break;
    }

    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        notificationType: NotificationType.SYSTEM_NOTIFICATION,
        priority: "medium",
      },
    });
  }

  /**
   * Send admin notification for admin logins
   */
  static async sendAdminLoginNotification(
    adminUserId: string,
    adminName: string
  ) {
    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        userRoles: { has: "ADMIN" },
        id: { not: adminUserId }, // Exclude the logging in admin
      },
      select: { id: true },
    });

    // Send notification to all other admins
    const notifications = adminUsers.map((admin) => ({
      userId: admin.id,
      title: "Admin Login Alert",
      message: `Admin ${adminName} logged into the system`,
      notificationType: NotificationType.SYSTEM_NOTIFICATION,
      priority: "high",
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }
  }

  /**
   * Get user's active devices
   */
  static async getUserDevices(userId: string) {
    return await prisma.device.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        deviceType: true,
        os: true,
        browser: true,
        lastLoginAt: true,
        lastIP: true,
        lastLocation: true,
        batteryLevel: true,
        loginCount: true,
      },
      orderBy: { lastLoginAt: "desc" },
    });
  }

  /**
   * Deactivate a device
   */
  static async deactivateDevice(userId: string, deviceId: string) {
    await prisma.device.updateMany({
      where: {
        userId,
        deviceId,
      },
      data: {
        isActive: false,
      },
    });

    // Invalidate all sessions for this device
    await prisma.session.updateMany({
      where: {
        userId,
        device: {
          deviceId,
        },
      },
      data: {
        isActive: false,
      },
    });
  }
}
