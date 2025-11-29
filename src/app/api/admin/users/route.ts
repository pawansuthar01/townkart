import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnlyMiddleware } from "@/middleware/auth.middleware";

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const authResult = await adminOnlyMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "ALL";
    const status = searchParams.get("status") || "ALL";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search } },
      ];
    }

    if (role !== "ALL") {
      where.userRoles = { has: role };
    }

    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "INACTIVE") {
      where.isActive = false;
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          phoneNumber: true,
          fullName: true,
          email: true,
          userRoles: true,
          activeRole: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          name: user.fullName || "N/A",
          email: user.email || "N/A",
          phone: user.phoneNumber,
          role: user.activeRole,
          roles: user.userRoles,
          status: user.isActive ? "ACTIVE" : "INACTIVE",
          joinDate: user.createdAt.toISOString().split("T")[0],
          lastLogin: user.lastLoginAt?.toISOString().split("T")[0] || "Never",
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
