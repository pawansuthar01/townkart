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

    // Get chart data using Prisma aggregation
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    // Revenue chart
    const revenueData = await prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        paymentStatus: "COMPLETED",
        createdAt: {
          gte: oneYearAgo,
        },
      },
      _sum: {
        finalAmount: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Orders chart
    const ordersData = await prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: oneYearAgo,
        },
      },
      _count: true,
      orderBy: {
        createdAt: "asc",
      },
    });

    // Users chart
    const usersData = await prisma.user.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: oneYearAgo,
        },
      },
      _count: true,
      orderBy: {
        createdAt: "asc",
      },
    });

    // Process data to monthly format
    const processMonthlyData = (data: any[], key: string) => {
      const monthlyMap = new Map<string, number>();

      data.forEach((item) => {
        const date = new Date(item.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const value = item._sum?.[key] || item._count || 0;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + value);
      });

      return Array.from(monthlyMap.entries())
        .map(([month, value]) => ({ month, [key]: value }))
        .sort((a, b) => a.month.localeCompare(b.month));
    };

    const revenue = processMonthlyData(revenueData, "revenue");
    const orders = processMonthlyData(ordersData, "orders");
    const users = processMonthlyData(usersData, "users");

    return NextResponse.json({
      success: true,
      data: {
        revenue,
        orders,
        users,
      },
    });
  } catch (error) {
    console.error("Admin dashboard charts error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard charts" },
      { status: 500 }
    );
  }
}
