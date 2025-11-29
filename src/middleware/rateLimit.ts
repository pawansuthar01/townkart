import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxAttempts: number; // Maximum attempts allowed
  blockDurationMs: number; // How long to block after max attempts
  progressiveDelay: boolean; // Whether to add progressive delays
}

const LOGIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  blockDurationMs: 30 * 60 * 1000, // 30 minutes block
  progressiveDelay: true,
};

export class RateLimiter {
  static async getClientIP(request: NextRequest): Promise<string> {
    // Try to get real IP from various headers
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

    // Fallback to a hashed version of the IP for privacy
    return "unknown";
  }

  static async checkLoginAttempts(
    identifier: string,
    ipAddress: string,
    request: NextRequest,
  ): Promise<{
    allowed: boolean;
    remainingAttempts: number;
    blockUntil?: Date;
    delayMs?: number;
  }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - LOGIN_RATE_LIMIT.windowMs);

    // Get recent login attempts for this identifier/IP combination
    const recentAttempts = await prisma.loginAttempt.findMany({
      where: {
        OR: [
          { identifier, createdAt: { gte: windowStart } },
          { ipAddress, createdAt: { gte: windowStart } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const failedAttempts = recentAttempts.filter(
      (attempt: any) => !attempt.success,
    );
    const totalAttempts = recentAttempts.length;

    // Check if currently blocked
    const lastFailedAttempt = failedAttempts[0];
    if (
      lastFailedAttempt &&
      failedAttempts.length >= LOGIN_RATE_LIMIT.maxAttempts
    ) {
      const blockUntil = new Date(
        lastFailedAttempt.createdAt.getTime() +
          LOGIN_RATE_LIMIT.blockDurationMs,
      );

      if (now < blockUntil) {
        return {
          allowed: false,
          remainingAttempts: 0,
          blockUntil,
        };
      }
    }

    // Calculate remaining attempts
    const remainingAttempts = Math.max(
      0,
      LOGIN_RATE_LIMIT.maxAttempts - failedAttempts.length,
    );

    // Calculate progressive delay if enabled
    let delayMs: number | undefined;
    if (LOGIN_RATE_LIMIT.progressiveDelay && failedAttempts.length > 0) {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s...
      delayMs = Math.min(16000, Math.pow(2, failedAttempts.length - 1) * 1000);
    }

    return {
      allowed: remainingAttempts > 0,
      remainingAttempts,
      delayMs,
    };
  }

  static async recordLoginAttempt(
    identifier: string,
    ipAddress: string,
    userAgent: string | null,
    success: boolean,
    failureReason?: string,
    userId?: string,
  ): Promise<any> {
    try {
      const attempt = await prisma.loginAttempt.create({
        data: {
          identifier,
          ipAddress,
          userAgent: userAgent || undefined,
          success,
          failureReason: failureReason || undefined,
          userId: userId || undefined,
        },
      });
      return attempt;
    } catch (error) {
      // Log error but don't fail the request
      console.error("Failed to record login attempt:", error);
      return null;
    }
  }

  static async createRateLimitResponse(
    message: string,
    retryAfter?: number,
  ): Promise<NextResponse> {
    const response = NextResponse.json(
      {
        error: "Too Many Requests",
        message,
        retryAfter,
      },
      { status: 429 },
    );

    if (retryAfter) {
      response.headers.set("Retry-After", retryAfter.toString());
    }

    return response;
  }
}
