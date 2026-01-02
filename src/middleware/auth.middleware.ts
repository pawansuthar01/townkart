import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeviceManager } from "@/lib/deviceManager";
import { RBAC } from "./rbac";

async function validateRiderSession(session: any): Promise<boolean> {
  try {
    // Check if session exists and is active
    const dbSession = await prisma.session.findFirst({
      where: {
        userId: session.user.id,
        sessionToken: session.sessionToken,
        isActive: true,
        expires: {
          gt: new Date(),
        },
      },
      include: {
        device: true,
      },
    });

    if (!dbSession) {
      console.log("Session validation failed: Session not found or expired");
      return false;
    }

    // Check if device is still active
    if (!dbSession.device || !dbSession.device.isActive) {
      console.log("Session validation failed: Device not active");
      return false;
    }

    // For riders, check if they have other active devices (should be single device)
    if (dbSession.deviceId) {
      const activeDevices = await prisma.device.count({
        where: {
          userId: session.user.id,
          isActive: true,
          deviceId: { not: dbSession.deviceId },
        },
      });

      if (activeDevices > 0) {
        console.log(
          "Session validation failed: Multiple active devices for rider"
        );
        // Force logout from all other devices
        await DeviceManager.forceLogoutOtherDevices(
          session.user.id,
          dbSession.deviceId,
          session.user.activeRole
        );
      }
    }

    return true;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    "/api/auth/[...nextauth]",
  ];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const activeRole = (session.user as any).activeRole || "CUSTOMER";

    // Add user info to headers for use in API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", session.user.id);
    requestHeaders.set(
      "x-user-roles",
      JSON.stringify((session.user as any).roles || [])
    );
    requestHeaders.set("x-active-role", activeRole);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication error" },
      { status: 401 }
    );
  }
}

export function roleBasedAccessControl(
  userRoles: string[],
  activeRole: string,
  requiredPermissions: string[]
): boolean {
  console.log("Checking permissions:", {
    userRoles,
    activeRole,
    requiredPermissions,
  });

  // Check if user has the active role
  if (!userRoles.includes(activeRole)) {
    return false;
  }

  // For admin, allow all permissions
  if (activeRole === "ADMIN") {
    return true;
  }

  // Check permissions using RBAC system
  // Convert string permissions to RBAC format (assuming format like "manage_users")
  const rbacPermissions = requiredPermissions.map((perm) => {
    const parts = perm.split("_");
    if (parts.length >= 2) {
      const action = parts[0];
      const resource = parts.slice(1).join("_");
      return { resource, action };
    }
    return { resource: perm, action: "*" };
  });

  return rbacPermissions.every((perm) =>
    RBAC.hasPermission(userRoles, perm.resource, perm.action)
  );
}

// Middleware for specific routes
export async function customerOnlyMiddleware(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userRoles = (session.user as any).roles || [];
    const activeRole = (session.user as any).activeRole || "";

    if (!roleBasedAccessControl(userRoles, activeRole, ["view_products"])) {
      return NextResponse.json(
        { success: false, message: "Customer access required" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Authentication error" },
      { status: 401 }
    );
  }
}

export async function merchantOnlyMiddleware(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userRoles = (session.user as any).roles || [];
    const activeRole = (session.user as any).activeRole || "";

    if (!roleBasedAccessControl(userRoles, activeRole, ["manage_products"])) {
      return NextResponse.json(
        { success: false, message: "Merchant access required" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Authentication error" },
      { status: 401 }
    );
  }
}

export async function riderOnlyMiddleware(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userRoles = (session.user as any).roles || [];
    const activeRole = (session.user as any).activeRole || "";

    if (
      !roleBasedAccessControl(userRoles, activeRole, [
        "view_available_deliveries",
      ])
    ) {
      return NextResponse.json(
        { success: false, message: "Rider access required" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Authentication error" },
      { status: 401 }
    );
  }
}

export async function adminOnlyMiddleware(request: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const userRoles = session.user.roles || [];
    const activeRole = session.user.activeRole || "";

    if (!roleBasedAccessControl(userRoles, activeRole, ["manage_users"])) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return NextResponse.json(
      { success: false, message: "Authentication error" },
      { status: 401 }
    );
  }
}

// Route-specific middleware configuration
export const routeMiddleware: Record<
  string,
  (request: NextRequest) => Promise<NextResponse>
> = {
  // Customer routes
  "/api/orders": customerOnlyMiddleware,
  "/api/users/profile": authMiddleware,
  "/api/users/addresses": authMiddleware,

  // Merchant routes
  "/api/products": merchantOnlyMiddleware,
  "/api/shops": merchantOnlyMiddleware,

  // Rider routes
  "/api/deliveries": riderOnlyMiddleware,

  // Admin routes
  "/api/admin": adminOnlyMiddleware,
  "/admin": adminOnlyMiddleware,
};

// Main middleware function

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply auth middleware first
  const authResult = await authMiddleware(request);
  if (authResult.status !== 200) {
    return authResult;
  }

  // Apply route-specific middleware
  for (const [route, middlewareFn] of Object.entries(routeMiddleware)) {
    if (pathname.startsWith(route)) {
      const result = await middlewareFn(request);
      if (result.status !== 200) {
        return result;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
