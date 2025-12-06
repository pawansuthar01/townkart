import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { DeviceTracker } from "@/middleware/deviceTracking";
import { RateLimiter } from "@/middleware/rateLimit";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";

// Security headers helper function
function addSecurityHeaders(response: NextResponse) {
  // Security headers for production
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // CORS headers for API routes
  if (response.url?.includes("/api/")) {
    response.headers.set(
      "Access-Control-Allow-Origin",
      process.env.ALLOWED_ORIGINS || "*"
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  return response;
}

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    // Public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/auth/login",
      "/auth/*",
      "/auth/register",
      "/auth/verify-otp",
      "/unauthorized",
      "/about",
      "/contact",
      "/categories",
      "/collections",
      "/cart",
      "/contact",
      "/wishlist",
      "/products",
      "/support",
      "/privacy",
      "/terms",
    ];

    // Public API routes
    const publicApiRoutes = [
      "/api/auth/*",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/[...nextauth]",
      "/api/auth/verify-otp",
      "/api/auth/refresh-token",
      "/api/auth/session",
      "/api/auth/signin",
      "/api/auth/signout",
      "/api/auth/callback",
      "/api/auth/csrf",
      "/api/auth/providers",
      "/api/auth/error",
      "/api/banners",
      "/api/ads",
      "/api/stats",
      "/api/categories",
      "/api/products",
      "/api/special-offers",
      "/api/system/status",
    ];

    // Check if the current route is public
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    // Check if it's a public API route
    const isPublicApiRoute = publicApiRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isPublicRoute || isPublicApiRoute) {
      // Add security headers for all responses
      const response = NextResponse.next();
      addSecurityHeaders(response);
      return response;
    }

    // If no token, redirect to login
    if (!token) {
      const response = NextResponse.redirect(new URL("/auth/login", req.url));
      addSecurityHeaders(response);
      return response;
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
        const response = NextResponse.next();
        addSecurityHeaders(response);
        return response;
      }
      // Redirect to unauthorized page for phone unverified
      const response = NextResponse.redirect(
        new URL("/unauthorized?reason=phone_unverified", req.url)
      );
      addSecurityHeaders(response);
      return response;
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
        const response = NextResponse.next();
        addSecurityHeaders(response);
        return response;
      }
      // Redirect to unauthorized page with reason
      const response = NextResponse.redirect(
        new URL("/unauthorized?reason=account_inactive", req.url)
      );
      addSecurityHeaders(response);
      return response;
    }

    // Role-based route protection
    const userRole = token.activeRole as string;

    // Customer routes
    if (pathname.startsWith("/customer") && userRole !== "CUSTOMER") {
      const response = NextResponse.redirect(new URL("/unauthorized", req.url));
      addSecurityHeaders(response);
      return response;
    }

    // Merchant routes
    if (pathname.startsWith("/store") && userRole !== "STORE_MANAGER") {
      const response = NextResponse.redirect(new URL("/unauthorized", req.url));
      addSecurityHeaders(response);
      return response;
    }

    // Rider routes
    if (pathname.startsWith("/rider") && userRole !== "RIDER") {
      const response = NextResponse.redirect(new URL("/unauthorized", req.url));
      addSecurityHeaders(response);
      return response;
    }

    // Admin routes (if any)
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      const response = NextResponse.redirect(new URL("/unauthorized", req.url));
      addSecurityHeaders(response);
      return response;
    }

    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
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
          "/unauthorized",
          "/about",
          "/contact",
          "/privacy",
          "/terms",
        ];

        // Public API routes
        const publicApiRoutes = [
          "/api/auth/login",
          "/api/auth/register",
          "/api/auth/verify-otp",
          "/api/auth/refresh-token",
          "/api/auth/session",
          "/api/auth/signin",
          "/api/auth/signout",
          "/api/auth/callback",
          "/api/auth/csrf",
          "/api/auth/providers",
          "/api/auth/error",
          "/api/banners",
          "/api/ads",
          "/api/categories",
          "/api/products",
          "/api/special-offers",
          "/api/system/status",
        ];

        const isPublicRoute = publicRoutes.some(
          (route) => pathname === route || pathname.startsWith(`${route}/`)
        );

        const isPublicApiRoute = publicApiRoutes.some(
          (route) => pathname === route || pathname.startsWith(`${route}/`)
        );

        if (isPublicRoute || isPublicApiRoute) return true;

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
     * - public folder files (images, icons, etc.)
     * - api/webhooks (webhook endpoints that bypass auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/|api/webhooks).*)",
  ],
};
