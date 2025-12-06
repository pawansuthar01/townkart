import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LocationService } from "@/lib/locationService";

export interface DeviceInfo {
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  os?: string;
  browser?: string;
  fingerprint?: string;
  batteryLevel?: number;
}

export interface LoginContext {
  deviceInfo: DeviceInfo;
  locationInfo: {
    ip: string;
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  userAgent: string;
}

export class DeviceTracker {
  static generateDeviceFingerprint(request: NextRequest): string {
    const userAgent = request.headers.get("user-agent") || "";
    const acceptLanguage = request.headers.get("accept-language") || "";
    const platform = request.headers.get("sec-ch-ua-platform") || "";

    // Create a simple fingerprint from user agent and platform
    const fingerprint = `${userAgent}-${acceptLanguage}-${platform}`;
    return Buffer.from(fingerprint).toString("base64").substring(0, 32);
  }

  static async trackDevice(
    userId: string,
    request: NextRequest,
    sessionId?: string
  ): Promise<void> {
    try {
      const deviceFingerprint = this.generateDeviceFingerprint(request);
      const userAgent = request.headers.get("user-agent");
      const ipAddress = await this.getClientIP(request);
      const locationInfo =
        await LocationService.getLocationInfoFromIP(ipAddress);

      // Check if device already exists
      let device = await prisma.device.findFirst({
        where: {
          userId,
          deviceId: deviceFingerprint,
        },
      });

      if (!device) {
        // Create new device record
        device = await prisma.device.create({
          data: {
            userId,
            deviceId: deviceFingerprint,
            deviceName: this.getDeviceName(userAgent),
            deviceType: this.getDeviceType(userAgent),
            os: this.getOS(userAgent),
            browser: this.getBrowser(userAgent),
            fingerprint: deviceFingerprint,
            lastIP: ipAddress,
            lastLocation: {
              country: locationInfo.country,
              city: locationInfo.city,
              region: locationInfo.region,
              lat: locationInfo.latitude,
              lng: locationInfo.longitude,
            },
            loginCount: 1,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Update existing device
        await prisma.device.update({
          where: { id: device.id },
          data: {
            lastIP: ipAddress,
            lastLocation: {
              country: locationInfo.country,
              city: locationInfo.city,
              region: locationInfo.region,
              lat: locationInfo.latitude,
              lng: locationInfo.longitude,
            },
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
          },
        });
      }

      // Update session with device and location info if sessionId provided
      if (sessionId && device) {
        await prisma.session.updateMany({
          where: {
            id: sessionId,
            userId,
          },
          data: {
            deviceId: device.id,
            ipAddress,
            userAgent,
            location: {
              country: locationInfo.country,
              city: locationInfo.city,
              region: locationInfo.region,
              lat: locationInfo.latitude,
              lng: locationInfo.longitude,
            },
            lastActivity: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Device tracking error:", error);
      // Don't fail the request if device tracking fails
    }
  }

  static async getActiveSessions(userId: string) {
    return await prisma.session.findMany({
      where: {
        userId,
        expires: { gt: new Date() },
      },
      include: {
        device: true,
      },
      orderBy: { lastActivity: "desc" },
    });
  }

  static async terminateSession(
    sessionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { device: true },
      });

      if (!session) return false;

      const result = await prisma.session.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          lastActivity: new Date(),
        },
      });

      // Log the logout
      await this.logDeviceLogin(
        userId,
        session.deviceId || undefined,
        "LOGOUT",
        {
          deviceInfo: {
            deviceId: session.deviceId || "unknown",
            deviceType: session.device?.deviceType || "unknown",
          },
          locationInfo: {
            ip: session.ipAddress || "unknown",
            ...(session.location as any),
          },
          userAgent: session.userAgent || "",
        },
        "LOW",
        ["Session terminated by user"]
      );

      return !!result;
    } catch (error) {
      console.error("Session termination error:", error);
      return false;
    }
  }

  static async terminateAllSessions(
    userId: string,
    exceptSessionId?: string
  ): Promise<number> {
    try {
      const sessionsToTerminate = await prisma.session.findMany({
        where: {
          userId,
          ...(exceptSessionId && { id: { not: exceptSessionId } }),
        },
        include: { device: true },
      });

      const result = await prisma.session.updateMany({
        where: {
          userId,
          ...(exceptSessionId && { id: { not: exceptSessionId } }),
        },
        data: {
          isActive: false,
          lastActivity: new Date(),
        },
      });

      // Log logout for each terminated session
      for (const session of sessionsToTerminate) {
        await this.logDeviceLogin(
          userId,
          session.deviceId || undefined,
          "LOGOUT",
          {
            deviceInfo: {
              deviceId: session.deviceId || "unknown",
              deviceType: session.device?.deviceType || "unknown",
            },
            locationInfo: {
              ip: session.ipAddress || "unknown",
              ...(session.location as any),
            },
            userAgent: session.userAgent || "",
          },
          "LOW",
          ["All sessions terminated"]
        );
      }

      return result.count;
    } catch (error) {
      console.error("Terminate all sessions error:", error);
      return 0;
    }
  }

  static async getOrCreateDevice(
    userId: string,
    deviceInfo: DeviceInfo,
    locationInfo: LoginContext["locationInfo"]
  ) {
    let device = await prisma.device.findFirst({
      where: {
        userId,
        deviceId: deviceInfo.deviceId,
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
            lat: locationInfo.latitude,
            lng: locationInfo.longitude,
          },
          loginCount: 1,
          lastLoginAt: new Date(),
          batteryLevel: deviceInfo.batteryLevel,
        },
      });
    } else {
      // Update device info
      device = await prisma.device.update({
        where: { id: device.id },
        data: {
          lastIP: locationInfo.ip,
          lastLocation: {
            country: locationInfo.country,
            city: locationInfo.city,
            region: locationInfo.region,
            lat: locationInfo.latitude,
            lng: locationInfo.longitude,
          },
          lastLoginAt: new Date(),
          loginCount: { increment: 1 },
          batteryLevel: deviceInfo.batteryLevel,
        },
      });
    }

    return device;
  }

  static async logDeviceLogin(
    userId: string,
    deviceId: string | undefined,
    loginType: string,
    context: LoginContext,
    riskLevel: string = "LOW",
    reasons: string[] = []
  ) {
    // Skip logging if deviceId is not available (device not found/created)
    if (!deviceId) {
      console.log(
        `Skipping device login log for ${loginType} - no device ID available`
      );
      return;
    }

    try {
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
            lat: context.locationInfo.latitude,
            lng: context.locationInfo.longitude,
          },
          deviceType: context.deviceInfo.deviceType,
          batteryLevel: context.deviceInfo.batteryLevel,
          riskLevel,
          riskReasons: reasons.length > 0 ? reasons : undefined,
          isSuspicious: riskLevel === "HIGH",
        },
      });
    } catch (error) {
      console.error("Device login logging error:", error);
    }
  }

  private static async getClientIP(request: NextRequest): Promise<string> {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const clientIP = request.headers.get("x-client-ip");

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (clientIP) {
      return clientIP;
    }

    return "unknown";
  }

  static getDeviceName(userAgent: string | null): string | undefined {
    if (!userAgent) return undefined;

    // Simple device name extraction
    if (userAgent.includes("Mobile")) return "Mobile Device";
    if (userAgent.includes("Tablet")) return "Tablet";
    return "Desktop";
  }

  static getDeviceType(userAgent: string | null): string {
    if (!userAgent) return "unknown";

    if (
      userAgent.includes("Mobile") ||
      userAgent.includes("Android") ||
      userAgent.includes("iPhone")
    ) {
      return "mobile";
    }
    if (userAgent.includes("Tablet") || userAgent.includes("iPad")) {
      return "tablet";
    }
    return "desktop";
  }

  static getOS(userAgent: string | null): string | undefined {
    if (!userAgent) return undefined;

    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac OS")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    return "Unknown";
  }

  static getBrowser(userAgent: string | null): string | undefined {
    if (!userAgent) return undefined;

    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }
}
