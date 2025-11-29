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

    // Get dashboard statistics
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalStores,
      totalRiders,
      totalRevenue,
      activeOrders,
      pendingDeliveries,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total products
      prisma.product.count(),

      // Total orders
      prisma.order.count(),

      // Total stores
      prisma.store.count(),

      // Total riders
      prisma.riderProfile.count(),

      // Total revenue
      prisma.order.aggregate({
        _sum: {
          finalAmount: true,
        },
        where: {
          paymentStatus: "COMPLETED",
        },
      }),

      // Active orders (not delivered or cancelled)
      prisma.order.count({
        where: {
          orderStatus: {
            notIn: ["DELIVERED", "CANCELLED"],
          },
        },
      }),

      // Pending deliveries
      prisma.delivery.count({
        where: {
          deliveryStatus: {
            in: ["ASSIGNED", "PICKED_UP"],
          },
        },
      }),
    ]);

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            fullName: true,
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get top products
    const topProducts = await prisma.product.findMany({
      take: 5,
      orderBy: {
        totalSales: "desc",
      },
      select: {
        name: true,
        totalSales: true,
        price: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalStores,
          totalRiders,
          totalRevenue: totalRevenue._sum.finalAmount || 0,
          activeOrders,
          pendingDeliveries,
        },
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          customer: order.customer.fullName,
          store: order.store.name,
          total: order.finalAmount,
          status: order.orderStatus,
          date: order.createdAt.toISOString().split("T")[0],
        })),
        topProducts: topProducts.map((product) => ({
          name: product.name,
          sales: product.totalSales,
          revenue: product.totalSales * product.price,
        })),
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
