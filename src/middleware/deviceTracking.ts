import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    sessionId?: string,
  ): Promise<void> {
    try {
      const deviceFingerprint = this.generateDeviceFingerprint(request);
      const userAgent = request.headers.get("user-agent");
      const ipAddress = await this.getClientIP(request);

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
            lastIP: ipAddress,
            loginCount: 1,
          },
        });
      } else {
        // Update existing device
        await prisma.device.update({
          where: { id: device.id },
          data: {
            lastIP: ipAddress,
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
          },
        });
      }

      // Create or update session if sessionId provided
      if (sessionId && device) {
        await prisma.session.upsert({
          where: { id: sessionId },
          update: {
            deviceId: device.id,
            ipAddress,
            userAgent,
            lastActivity: new Date(),
          },
          create: {
            id: sessionId,
            userId,
            sessionToken: sessionId, // This should be the actual session token
            deviceId: device.id,
            ipAddress,
            userAgent,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
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
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        device: true,
      },
      orderBy: { lastActivity: "desc" },
    });
  }

  static async terminateSession(
    sessionId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const result = await prisma.session.updateMany({
        where: {
          id: sessionId,
          userId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
      return result.count > 0;
    } catch (error) {
      console.error("Session termination error:", error);
      return false;
    }
  }

  static async terminateAllSessions(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    try {
      const result = await prisma.session.updateMany({
        where: {
          userId,
          isActive: true,
          ...(exceptSessionId && { id: { not: exceptSessionId } }),
        },
        data: {
          isActive: false,
        },
      });
      return result.count;
    } catch (error) {
      console.error("Terminate all sessions error:", error);
      return 0;
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

  private static getDeviceName(userAgent: string | null): string | undefined {
    if (!userAgent) return undefined;

    // Simple device name extraction
    if (userAgent.includes("Mobile")) return "Mobile Device";
    if (userAgent.includes("Tablet")) return "Tablet";
    return "Desktop";
  }

  private static getDeviceType(userAgent: string | null): string {
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

  private static getOS(userAgent: string | null): string | undefined {
    if (!userAgent) return undefined;

    if (userAgent.includes("Windows")) return "Windows";
    if (userAgent.includes("Mac OS")) return "macOS";
    if (userAgent.includes("Linux")) return "Linux";
    if (userAgent.includes("Android")) return "Android";
    if (userAgent.includes("iOS")) return "iOS";
    return "Unknown";
  }

  private static getBrowser(userAgent: string | null): string | undefined {
    if (!userAgent) return undefined;

    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  }
}
