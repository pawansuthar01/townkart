import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get store staff's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get orders for the store
    const orders = await prisma.order.findMany({
      where: {
        storeId: storeStaff.storeId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        orderItems: true,
      },
    });

    // Calculate metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.finalAmount,
      0,
    );
    const totalItems = orders.reduce(
      (sum, order) => sum + order.orderItems.length,
      0,
    );

    // Calculate commission (assuming 10% for now, should be from store config)
    const commissionRate = 0.1; // 10%
    const totalCommission = totalRevenue * commissionRate;
    const netEarnings = totalRevenue - totalCommission;

    // Status breakdown
    const statusCounts = orders.reduce(
      (acc, order) => {
        acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Daily revenue trend (last 7 days)
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = orders.filter(
        (order) => order.createdAt >= dayStart && order.createdAt <= dayEnd,
      );

      const dayRevenue = dayOrders.reduce(
        (sum, order) => sum + order.finalAmount,
        0,
      );

      dailyRevenue.push({
        date: dayStart.toISOString().split("T")[0],
        revenue: dayRevenue,
        orders: dayOrders.length,
      });
    }

    // Top products
    const productSales = orders.flatMap((order) =>
      order.orderItems.map((item) => ({
        productId: item.productId,
        productName: (item.productSnapshot as any)?.name || "Unknown Product",
        quantity: item.quantity,
        revenue: item.subtotal,
      })),
    );

    const topProducts = productSales.reduce(
      (acc, item) => {
        if (!acc[item.productId]) {
          acc[item.productId] = {
            id: item.productId,
            name: item.productName,
            totalSold: 0,
            totalRevenue: 0,
          };
        }
        acc[item.productId].totalSold += item.quantity;
        acc[item.productId].totalRevenue += item.revenue;
        return acc;
      },
      {} as Record<string, any>,
    );

    const topProductsArray = Object.values(topProducts)
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      analytics: {
        period,
        summary: {
          totalOrders,
          totalRevenue,
          totalItems,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          commissionRate,
          totalCommission,
          netEarnings,
        },
        statusBreakdown: statusCounts,
        dailyRevenue,
        topProducts: topProductsArray,
      },
    });
  } catch (error) {
    console.error("Store analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
