import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs: number;
  progressiveDelay: boolean;
}

const LOGIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxAttempts: 5,
  blockDurationMs: 60 * 1000, // 1 minute
  progressiveDelay: false,
};

export class RateLimiter {
  /* ---------------- IP UTILITY ---------------- */
  static async getClientIP(request: any): Promise<string> {
    if (request?.headers?.get) {
      const forwarded = request.headers.get("x-forwarded-for");
      const realIP = request.headers.get("x-real-ip");
      const clientIP = request.headers.get("x-client-ip");

      if (forwarded) return forwarded.split(",")[0].trim();
      if (realIP) return realIP;
      if (clientIP) return clientIP;
    }

    if (request?.headers && typeof request.headers === "object") {
      const forwarded =
        request.headers["x-forwarded-for"] ||
        request.headers["x-real-ip"] ||
        request.headers["x-client-ip"];

      if (typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
      }
    }

    return "unknown";
  }

  /* ---------------- RATE LIMIT CHECK ---------------- */
  static async checkLoginAttempts(
    identifier: string,
    ipAddress: string
  ): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    blockUntil?: Date;
    delayMs: number;
    Ws: number;
  }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - LOGIN_RATE_LIMIT.windowMs);

    const [identifierAttempts, ipAttempts] = await Promise.all([
      prisma.loginAttempt.findMany({
        where: { identifier, createdAt: { gte: windowStart } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.loginAttempt.findMany({
        where: { ipAddress, createdAt: { gte: windowStart } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const allAttempts = [...identifierAttempts, ...ipAttempts];
    const failedAttempts = allAttempts.filter((a) => !a.success);

    const lastFailedAttempt = failedAttempts[0];
    const blockUntil = new Date(
      lastFailedAttempt?.createdAt?.getTime() + LOGIN_RATE_LIMIT.blockDurationMs
    );
    if (
      lastFailedAttempt &&
      failedAttempts.length >= LOGIN_RATE_LIMIT.maxAttempts
    ) {
      if (now < blockUntil) {
        return {
          allowed: false,
          remainingAttempts: 0,
          blockUntil,
          delayMs: LOGIN_RATE_LIMIT.blockDurationMs,
          Ws: Math.ceil((new Date(blockUntil).getTime() - Date.now()) / 1000),
        };
      }
    }

    const remainingAttempts = Math.max(
      0,
      LOGIN_RATE_LIMIT.maxAttempts - failedAttempts.length
    );

    let delayMs = 0;
    if (LOGIN_RATE_LIMIT.progressiveDelay && failedAttempts.length > 0) {
      delayMs = Math.min(16000, Math.pow(2, failedAttempts.length - 1) * 1000);
    }

    return {
      allowed: remainingAttempts > 0,
      remainingAttempts,
      delayMs,
      Ws: Math.ceil((new Date(blockUntil).getTime() - Date.now()) / 1000),
    };
  }

  /* ---------------- RECORD ATTEMPT ---------------- */
  static async recordLoginAttempt(
    identifier: string,
    ipAddress: string,
    userAgent: string | null,
    success: boolean,
    failureReason?: string,
    userId?: string
  ) {
    try {
      return await prisma.loginAttempt.create({
        data: {
          identifier,
          ipAddress,
          userAgent: userAgent || undefined,
          success,
          failureReason: failureReason || undefined,
          userId: userId || undefined,
        },
      });
    } catch (error) {
      console.error("Failed to record login attempt:", error);
      return null;
    }
  }

  /* ---------------- RESPONSE ---------------- */
  static createRateLimitResponse(
    message: string,
    retryAfterMs?: number
  ): NextResponse {
    const response = NextResponse.json(
      {
        error: "Too Many Requests",
        message,
        retryAfterSeconds: retryAfterMs
          ? Math.ceil(retryAfterMs / 1000)
          : undefined,
      },
      { status: 429 }
    );

    if (retryAfterMs) {
      response.headers.set(
        "Retry-After",
        Math.ceil(retryAfterMs / 1000).toString()
      );
    }

    return response;
  }
}
