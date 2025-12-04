import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminOnlyMiddleware } from "@/middleware/auth.middleware";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const authResult = await adminOnlyMiddleware(request);
    if (authResult.status !== 200) {
      return authResult;
    }

    const { fullName, email, phoneNumber, password, role } =
      await request.json();

    if (!fullName || !email || !phoneNumber || !password || !role) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email or phone already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phoneNumber,
        password: hashedPassword,
        activeRole: role as "CUSTOMER" | "STORE_MANAGER" | "RIDER" | "ADMIN",
        userRoles: [role],
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber,
        role: user.activeRole,
      },
    });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const hasStore = searchParams.get("hasStore");

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

    if (hasStore === "false") {
      where.managedStores = { none: {} };
    } else if (hasStore === "true") {
      where.managedStores = { some: {} };
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
      { status: 500 }
    );
  }
}
