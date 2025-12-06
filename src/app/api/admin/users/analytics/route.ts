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

    // Get user growth data (monthly registrations)
    const userGrowthData = await prisma.user.groupBy({
      by: ["createdAt"],
      _count: true,
      orderBy: {
        createdAt: "asc",
      },
    });

    // Process user growth to monthly format
    const userGrowthMap = new Map<string, number>();
    userGrowthData.forEach((item) => {
      const date = new Date(item.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      userGrowthMap.set(
        monthKey,
        (userGrowthMap.get(monthKey) || 0) + item._count
      );
    });

    const userGrowth = Array.from(userGrowthMap.entries())
      .map(([month, users]) => ({ month, users }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months

    // Get role distribution using raw SQL
    const roleData = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count FROM User GROUP BY role
    `;

    const roleColors = {
      CUSTOMER: "#8884d8",
      STORE_MANAGER: "#82ca9d",
      RIDER: "#ffc658",
      ADMIN: "#ff7300",
    };

    const roleDistribution = (roleData as any[]).map((item: any) => ({
      role: item.role,
      count: Number(item.count),
      color: roleColors[item.role as keyof typeof roleColors] || "#8884d8",
    }));

    // Get status distribution using raw SQL
    const statusData = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count FROM User GROUP BY status
    `;

    const statusColors = {
      ACTIVE: "#10b981",
      INACTIVE: "#ef4444",
    };

    const statusDistribution = (statusData as any[]).map((item: any) => ({
      status: item.status,
      count: Number(item.count),
      color:
        statusColors[item.status as keyof typeof statusColors] || "#8884d8",
    }));

    return NextResponse.json({
      success: true,
      data: {
        userGrowth,
        roleDistribution,
        statusDistribution,
      },
    });
  } catch (error) {
    console.error("Admin user analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user analytics" },
      { status: 500 }
    );
  }
}
