import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface Permission {
  resource: string;
  action: string;
}

export interface RolePermissions {
  [role: string]: Permission[];
}

// Define permissions for each role
export const ROLE_PERMISSIONS: RolePermissions = {
  CUSTOMER: [
    { resource: "orders", action: "create" },
    { resource: "orders", action: "read_own" },
    { resource: "orders", action: "update_own" },
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update" },
    { resource: "addresses", action: "manage" },
    { resource: "wishlist", action: "manage" },
    { resource: "reviews", action: "create" },
    { resource: "reviews", action: "read_own" },
  ],
  STORE_MANAGER: [
    { resource: "store", action: "read" },
    { resource: "store", action: "update" },
    { resource: "orders", action: "read_store" },
    { resource: "orders", action: "update_store" },
    { resource: "products", action: "manage_store" },
    { resource: "inventory", action: "manage_store" },
    { resource: "staff", action: "manage_store" },
    { resource: "analytics", action: "read_store" },
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update" },
  ],
  RIDER: [
    { resource: "deliveries", action: "read_assigned" },
    { resource: "deliveries", action: "update_assigned" },
    { resource: "location", action: "update_own" },
    { resource: "availability", action: "update_own" },
    { resource: "earnings", action: "read_own" },
    { resource: "analytics", action: "read_own" },
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update" },
  ],
  ADMIN: [
    { resource: "*", action: "*" }, // Full access
  ],
};

export class RBAC {
  /**
   * Check if a user has permission for a specific action on a resource
   */
  static hasPermission(
    userRoles: string[],
    resource: string,
    action: string,
    context?: {
      userId?: string;
      storeId?: string;
      orderId?: string;
      deliveryId?: string;
    }
  ): boolean {
    // Admin has all permissions
    if (userRoles.includes("ADMIN")) {
      return true;
    }

    // Check each role the user has
    for (const role of userRoles) {
      const permissions = ROLE_PERMISSIONS[role];
      if (!permissions) continue;

      // Check for exact permission match
      const hasExactPermission = permissions.some(
        (perm) => perm.resource === resource && perm.action === action
      );

      // Check for wildcard permissions
      const hasWildcardPermission = permissions.some(
        (perm) => perm.resource === "*" || perm.action === "*"
      );

      if (hasExactPermission || hasWildcardPermission) {
        return true;
      }

      // Check for contextual permissions
      if (
        this.hasContextualPermission(role, resource, action, context) as any
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check contextual permissions (e.g., read_own, manage_store)
   */
  private static async hasContextualPermission(
    role: string,
    resource: string,
    action: string,
    context?: {
      userId?: string;
      storeId?: string;
      orderId?: string;
      deliveryId?: string;
    }
  ): Promise<boolean> {
    if (!context) return false;

    try {
      switch (resource) {
        case "orders":
          if (action === "read_own" && context.userId && context.orderId) {
            const order = await prisma.order.findUnique({
              where: { id: context.orderId },
              select: { customerId: true },
            });
            return order?.customerId === context.userId;
          }

          if (action === "read_store" && context.storeId && context.orderId) {
            const order = await prisma.order.findUnique({
              where: { id: context.orderId },
              select: { storeId: true },
            });
            return order?.storeId === context.storeId;
          }

          if (action === "update_store" && context.storeId && context.orderId) {
            const order = await prisma.order.findUnique({
              where: { id: context.orderId },
              select: { storeId: true },
            });
            return order?.storeId === context.storeId;
          }
          break;

        case "deliveries":
          if (
            action === "read_assigned" &&
            context.userId &&
            context.deliveryId
          ) {
            const delivery = await prisma.delivery.findUnique({
              where: { id: context.deliveryId },
              select: { riderId: true },
            });
            return delivery?.riderId === context.userId;
          }

          if (
            action === "update_assigned" &&
            context.userId &&
            context.deliveryId
          ) {
            const delivery = await prisma.delivery.findUnique({
              where: { id: context.deliveryId },
              select: { riderId: true },
            });
            return delivery?.riderId === context.userId;
          }
          break;

        case "store":
          if (action === "read" && context.userId && context.storeId) {
            // Check if user is store manager or staff
            const staff = await prisma.storeStaff.findFirst({
              where: {
                storeId: context.storeId,
                userId: context.userId,
              },
            });
            return !!staff;
          }
          break;
      }
    } catch (error) {
      console.error("Error checking contextual permission:", error);
      return false;
    }

    return false;
  }

  /**
   * Middleware function for API routes
   */
  static async authorize(
    request: NextRequest,
    requiredPermissions: Permission[],
    context?: {
      userId?: string;
      storeId?: string;
      orderId?: string;
      deliveryId?: string;
    }
  ): Promise<{ authorized: boolean; user?: any; error?: string }> {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return {
          authorized: false,
          error: "Missing or invalid authorization header",
        };
      }

      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      if (!decoded) {
        return { authorized: false, error: "Invalid or expired token" };
      }

      // Get user from database to verify roles
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          userRoles: true,
          activeRole: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        return { authorized: false, error: "User not found or inactive" };
      }

      // Check if user has required permissions
      const hasPermission = requiredPermissions.every((perm) =>
        this.hasPermission(user.userRoles, perm.resource, perm.action, {
          userId: user.id,
          ...context,
        })
      );

      if (!hasPermission) {
        return { authorized: false, error: "Insufficient permissions" };
      }

      return { authorized: true, user };
    } catch (error) {
      console.error("Authorization error:", error);
      return { authorized: false, error: "Authorization failed" };
    }
  }

  /**
   * Get user permissions for UI rendering
   */
  static getUserPermissions(userRoles: string[]): Permission[] {
    const permissions: Permission[] = [];

    for (const role of userRoles) {
      const rolePermissions = ROLE_PERMISSIONS[role];
      if (rolePermissions) {
        permissions.push(...rolePermissions);
      }
    }

    // Remove duplicates
    return permissions.filter(
      (perm, index, self) =>
        index ===
        self.findIndex(
          (p) => p.resource === perm.resource && p.action === perm.action
        )
    );
  }
}

// Export middleware function
export async function withRBAC(
  request: NextRequest,
  requiredPermissions: Permission[],
  context?: {
    userId?: string;
    storeId?: string;
    orderId?: string;
    deliveryId?: string;
  }
) {
  const auth = await RBAC.authorize(request, requiredPermissions, context);

  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  return auth.user;
}
