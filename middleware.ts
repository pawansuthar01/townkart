import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { DeviceTracker } from "@/middleware/deviceTracking";
import { RateLimiter } from "@/middleware/rateLimit";
import { prisma } from "@/lib/prisma";

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/auth/login",
      "/auth/register",
      "/auth/verify-otp",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/verify-otp",
      "/api/auth/refresh-token",
      "/unauthorized",
    ];

    // Check if the current route is public
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isPublicRoute) {
      return NextResponse.next();
    }

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Check if phone number is verified
    const phoneVerified = token.phoneVerified as boolean;
    if (!phoneVerified) {
      // Allow access to OTP verification pages
      if (
        pathname === "/auth/verify-otp" ||
        pathname === "/verify-otp" ||
        pathname.startsWith("/api/auth/verify-otp")
      ) {
        return NextResponse.next();
      }
      // Redirect to unauthorized page for phone unverified
      return NextResponse.redirect(
        new URL("/unauthorized?reason=phone_unverified", req.url)
      );
    }

    // Check if account is active
    const isActive = token.isActive as boolean;
    if (!isActive) {
      // Allow access to OTP verification pages for account reactivation
      if (
        pathname === "/auth/verify-otp" ||
        pathname === "/verify-otp" ||
        pathname.startsWith("/api/auth/verify-otp")
      ) {
        return NextResponse.next();
      }
      // Redirect to unauthorized page with reason
      return NextResponse.redirect(
        new URL("/unauthorized?reason=account_inactive", req.url)
      );
    }

    // Track device for authenticated users
    if (token.sub) {
      try {
        await DeviceTracker.trackDevice(token.sub, req);

        // Also update the most recent login attempt with device information
        const ipAddress = await RateLimiter.getClientIP(req);
        const userAgent = req.headers.get("user-agent");

        // Update the most recent successful login attempt for this user
        await prisma.loginAttempt.updateMany({
          where: {
            userId: token.sub,
            success: true,
            ipAddress: "unknown", // Only update records that haven't been updated yet
          },
          data: {
            ipAddress,
            userAgent: userAgent || undefined,
          },
        });
      } catch (error) {
        console.error("Device tracking error:", error);
        // Don't fail the request if device tracking fails
      }
    }

    // Role-based route protection
    const userRole = token.activeRole as string;

    // Customer routes
    if (pathname.startsWith("/customer") && userRole !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Merchant routes
    if (pathname.startsWith("/store") && userRole !== "STORE_MANAGER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Rider routes
    if (pathname.startsWith("/rider") && userRole !== "RIDER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Admin routes (if any)
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes
        const publicRoutes = [
          "/",
          "/auth/login",
          "/auth/register",
          "/auth/verify-otp",
          "/api/auth/login",
          "/api/auth/register",
          "/api/auth/verify-otp",
          "/api/auth/refresh-token",
          "/unauthorized",
        ];

        const isPublicRoute = publicRoutes.some(
          (route) => pathname === route || pathname.startsWith(`${route}/`)
        );

        if (isPublicRoute) return true;

        // For protected routes, require token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
