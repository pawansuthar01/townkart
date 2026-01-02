import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { DeviceTracker } from "@/middleware/deviceTracking";

// Security headers helper function
function addSecurityHeaders(response: NextResponse) {
  // Security headers for production
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

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
    // Set client information headers for authentication
    const clientIP = (await DeviceTracker.getClientIP(req)) || "unknown";

    const userAgent = req.headers.get("user-agent") || "unknown";

    // Set headers for NextAuth to use
    req.headers.set("x-client-ip", clientIP);
    req.headers.set("x-user-agent", userAgent);
    // Public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/auth/login",
      "/auth/register",
      "/auth/invitation",
      "/auth/verify-otp",
      "/unauthorized",
      "/about",
      "/contact",
      "/categories",
      "/collections",
      "/cart",
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
      "/api/auth/check-otp-requirement",
      "/api/auth/[...nextauth]",
      "/api/auth/verify-otp",
      "/api/auth/refresh-token",
      "/api/auth/session",
      "/api/auth/signin",
      "/api/auth/signup",

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
      "/api/admin/stores",
      "/api/store",
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
      const response = NextResponse.next();
      addSecurityHeaders(response);
      return response;
    }

    // If no token, redirect to login
    if (!token || !token.sessionToken) {
      const response = NextResponse.redirect(new URL("/auth/login", req.url));
      addSecurityHeaders(response);
      return response;
    }

    // Check if phone number is verified
    if (!token.isVerified) {
      // Allow access to OTP verification pages
      if (pathname.startsWith("/auth/verify-otp")) {
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
    if (!token.isActive) {
      // Allow access to OTP verification pages for account reactivation
      if (pathname.startsWith("/auth/verify-otp")) {
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
          "/auth/invitation",
          "/auth/verify-otp",
          "/unauthorized",
          "/about",
          "/contact",
          "/privacy",
          "/terms",
        ];

        // Public API routes
        const publicApiRoutes = [
          "/api/*",
          "/api/auth/login",
          "/api/auth/register",
          "/api/auth/check-otp-requirement",
          "/api/auth/verify-otp",
          "/api/auth/refresh-token",
          "/api/auth/session",
          "/api/auth/signin",
          "/api/auth/signup",

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
          "/api/store",
          "/api/admin/stores",
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
    "/((?!_next/static|_next/image|favicon.ico|public/|api/webhooks).*)",
  ],
};
