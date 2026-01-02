import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { Prisma, UserRole } from "@prisma/client";
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

import { RateLimiter } from "@/middleware/rateLimit";
import { DeviceManager } from "@/lib/deviceManager";
import { LocationService } from "@/lib/locationService";
import { DeviceTracker } from "@/middleware/deviceTracking";
import { locationMonitor } from "@/lib/locationMonitor";

declare module "next-auth" {
  interface User {
    id: string;
    image: string;
    name: string;
    email: string;
    phoneNumber: string;
    storeId?: string | null;
    riderId?: string | null;
    activeRole: UserRole;
    userRole?: UserRole[];
    roles: UserRole[];
    isVerified: boolean;
    deviceId: string;
    isActive: boolean;
    sessionToken: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      image: string;
      email: string;
      phoneNumber: string;
      storeId?: string | null;
      riderId?: string | null;
      activeRole: UserRole;
      userRole?: UserRole[];
      roles: UserRole[];
      isVerified: boolean;
      deviceId: string;
      isActive: boolean;
      sessionToken: string;
    };
    isValid?: boolean;
    sessionToken: string;
    deviceId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    image: string;
    phoneNumber?: string;
    activeRole: UserRole;
    userRole?: UserRole[];
    roles?: UserRole[];
    isVerified?: boolean;
    storeId?: string;
    riderId?: string;
    isActive: boolean;
    sessionToken: string;
    deviceId: string;
  }
}

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateAccessToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "15m" });
};
const generateSessionToken = (userId: string) =>
  `sess_${userId}_${crypto.randomBytes(16).toString("hex")}`;

export const generateRefreshToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "30d",
  });
};
function isOtpAllowed(user: {
  activeRole: UserRole;
  twoFactorEnabled?: boolean;
}) {
  if (
    user.activeRole === "ADMIN" ||
    user.activeRole === "STORE_MANAGER" ||
    user.activeRole === "RIDER"
  ) {
    return true;
  }

  if (user.activeRole === "CUSTOMER" && user.twoFactorEnabled === true) {
    return true;
  }

  return false;
}

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
};

export const forceUserLogout = async (
  userId: string,
  reason: string = "Security"
) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogoutAt: new Date() },
    });

    await prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    console.log(`🚪 Forced logout for user ${userId}: ${reason}`);
  } catch (error) {
    console.error(`Error forcing logout for user ${userId}:`, error);
  }
};

export const authOptions = {
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60,
  },

  providers: [
    // ---------------- GOOGLE ----------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // ---------------- PASSWORD LOGIN ----------------
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
        deviceInfo: { label: "Device Info", type: "text" },
        userInfo: { label: "User Info", type: "text" },
      },

      async authorize(credentials, req) {
        try {
          if (
            !credentials?.identifier ||
            !credentials?.userInfo ||
            typeof credentials.userInfo == "undefined"
          ) {
            return null;
          }
          const user = JSON.parse(credentials.userInfo);
          const ip = await RateLimiter.getClientIP(req as any);
          const ua = req?.headers?.["user-agent"] || "unknown";
          /* -------- RATE LIMIT -------- */
          const rate = await RateLimiter.checkLoginAttempts(
            credentials.identifier,
            ip
          );

          if (!rate.allowed) {
            await RateLimiter.recordLoginAttempt(
              credentials.identifier,
              ip,
              ua,
              false,
              "RATE_LIMIT"
            );
            return null;
          }

          await RateLimiter.recordLoginAttempt(
            credentials.identifier,
            ip,
            ua,
            true,
            undefined,
            user.id
          );

          // -------- DEVICE + LOCATION LOGIC ----------
          const location = await LocationService.getLocationInfoFromIP(ip);
          const { os, browser, deviceType } =
            LocationService.parseUserAgent(ua);

          const deviceId = DeviceTracker.generateDeviceFingerprint(req as any);

          const device = await DeviceManager.getOrCreateDevice(
            user.id,
            { deviceId, os, browser, deviceType },
            location
          );
          const sessionToken = generateSessionToken(user.id);

          await prisma.session.create({
            data: {
              userId: user.id,
              sessionToken,
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              deviceId: device.id,
              ipAddress: ip,
              userAgent: ua,
              location: location as unknown as Prisma.InputJsonValue,
              isActive: true,
            },
          });

          // Log device login
          await DeviceTracker.logDeviceLogin(
            user.id,
            device.id,
            "LOGIN",
            {
              deviceInfo: { deviceId, os, browser, deviceType },
              locationInfo: location,
              userAgent: ua,
            },
            "LOW",
            ["Password login successful"]
          );
          return {
            id: user.id,
            email: user.email || "",
            name: user.fullName ?? "",
            image: user.profileImageUrl,
            phoneNumber: user.phoneNumber,
            activeRole: user.activeRole,
            storeId: user.storeId,
            riderId: user.riderId,
            isActive: user.isActive,
            roles: user.userRoles,
            sessionToken,
            userRole: user.userRoles,

            isVerified: user.phoneVerified || user.emailVerified,
            deviceId: device.id,
          };
        } catch (err) {
          console.log("❌ Authorize Error", err);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: "otp",
      name: "otp",

      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        otp: { label: "OTP", type: "text" },
        deviceInfo: { label: "Device Info", type: "text" },
        userInfo: { label: "User Info", type: "text" },
      },

      async authorize(credentials, req) {
        if (
          !credentials?.phoneNumber ||
          typeof credentials.userInfo == "undefined"
        ) {
          return null;
        }
        const user = JSON.parse(credentials.userInfo);

        try {
          const ip =
            req?.headers?.["x-forwarded-for"]?.toString() || "127.0.0.1";
          const userAgent = req?.headers?.["user-agent"] || "unknown";

          const locationInfo = await LocationService.getLocationInfoFromIP(ip);

          const parsedUA = LocationService.parseUserAgent(userAgent);

          /* ---------- DEVICE ---------- */
          let devicePayload: any = {};
          if (credentials.deviceInfo) {
            try {
              devicePayload = JSON.parse(credentials.deviceInfo);
            } catch {}
          }

          const stableDeviceId =
            devicePayload.deviceId ||
            DeviceTracker.generateDeviceFingerprint(req as any);

          const finalDeviceData = {
            deviceId: stableDeviceId,
            deviceName: devicePayload.deviceName,
            deviceType: devicePayload.deviceType || parsedUA.deviceType,
            os: devicePayload.os || parsedUA.os,
            browser: devicePayload.browser || parsedUA.browser,
            fingerprint: devicePayload.fingerprint,
            batteryLevel: devicePayload.batteryLevel,
          };

          await DeviceManager.validateLocation(user.id, locationInfo);

          const device = await DeviceManager.getOrCreateDevice(
            user.id,
            finalDeviceData,
            locationInfo
          );

          /* ---------- CREATE DB SESSION (ONCE) ---------- */
          const sessionToken = generateSessionToken(user.id);

          await prisma.session.create({
            data: {
              userId: user.id,
              sessionToken,
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              deviceId: device.id,
              ipAddress: ip,
              userAgent,
              location: locationInfo as unknown as Prisma.InputJsonValue,
              isActive: true,
            },
          });

          // Log device login
          await DeviceTracker.logDeviceLogin(
            user.id,
            device.id,
            "LOGIN",
            {
              deviceInfo: finalDeviceData,
              locationInfo,
              userAgent,
            },
            "LOW",
            ["OTP login successful"]
          );

          return {
            id: user.id,
            email: user.email || "",
            name: user.fullName ?? "",
            image: user.profileImageUrl,
            phoneNumber: user.phoneNumber,
            activeRole: user.activeRole,
            isActive: user.isActive,
            roles: user.userRoles,
            userRole: user.userRoles,
            storeId: user.storeId,
            riderId: user.riderId,
            sessionToken,
            isVerified: user.phoneVerified || user.emailVerified,
            deviceId: device.id,
          };
        } catch (error) {
          console.error("OTP authorize error:", error);
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (!token?.sub || token.isActive === false) {
        return {
          ...session,
          user: null as any,
          isValid: false,
        };
      }

      session.user = {
        id: token.sub,
        name: token.name ?? "",
        email: token.email ?? "",
        image: token.image ?? "",
        phoneNumber: token.phoneNumber ?? "",
        activeRole: token.activeRole ?? "CUSTOMER",
        roles: token.roles ?? ["CUSTOMER"],
        userRole: token.userRole ?? token.roles ?? ["CUSTOMER"],
        isVerified: token.isVerified ?? false,
        storeId: token.storeId ?? null,
        riderId: token.riderId ?? null,
        deviceId: token.deviceId,
        isActive: token.isActive ?? true,
        sessionToken: token.sessionToken,
      };
      session.isValid = true;
      session.sessionToken = token.sessionToken;
      session.deviceId = token.deviceId;
      // Start location monitoring for riders
      if (
        session.user.activeRole === "RIDER" &&
        typeof window !== "undefined"
      ) {
        try {
          // Start location monitoring after a short delay to ensure session is established
          setTimeout(() => {
            locationMonitor.startMonitoring(session.user.id, "rider");
            console.log(
              "📍 Location monitoring started for rider:",
              session.user.id
            );
          }, 2000);
        } catch (error) {
          console.error("Failed to start location monitoring:", error);
        }
      }

      return session;
    },

    async jwt({ token, user }: { token: JWT; user?: User }) {
      // Initial login
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
        token.phoneNumber = user.phoneNumber;
        token.activeRole = user.activeRole;
        token.roles = user.roles;
        token.userRole = user.roles;
        token.storeId = user.storeId || undefined;
        token.riderId = user.riderId || undefined;
        token.isVerified = user.isVerified;
        token.deviceId = user.deviceId;
        token.sessionToken = user.sessionToken;
        token.isActive = user.isActive ?? true;
      }

      // Validate session ONLY if we can reach DB
      if (token.sessionToken && token.isActive !== false) {
        try {
          const dbSession = await prisma.session.findUnique({
            where: { sessionToken: token.sessionToken },
            select: {
              isActive: true,
              expires: true,
            },
          });

          // Explicit invalid cases → logout
          if (
            !dbSession ||
            dbSession.isActive === false ||
            dbSession.expires < new Date()
          ) {
            token.isActive = false;
          }

          // Valid DB session → keep active
        } catch (error) {
          console.error("⚠️ Session DB check failed (temporary):", error);

          token.isActive = token.isActive ?? true;
          token.dbCheckFailed = true; // optional debug flag
        }
      }

      return token;
    },

    /**
     * SIGN IN
     */
    async signIn() {
      return true;
    },

    /**
     * SIGN OUT
     * DB failure here should NOT block logout
     */
    async signOut({ token }: { token: JWT }) {
      // Stop location monitoring for riders
      if (token?.activeRole === "RIDER" && typeof window !== "undefined") {
        try {
          locationMonitor.stopMonitoring();
          console.log("📍 Location monitoring stopped for rider");
        } catch (error) {
          console.error("Failed to stop location monitoring:", error);
        }
      }

      if (token?.sessionToken) {
        try {
          await prisma.session.updateMany({
            where: { sessionToken: token.sessionToken },
            data: { isActive: false },
          });
        } catch (error) {
          console.error(
            "⚠️ Failed to deactivate session on sign out (safe to ignore):",
            error
          );
        }
      }
      return true;
    },
  },
};
