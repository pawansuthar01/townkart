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

    // Get dashboard statistics with error handling
    const statsPromises = [
      prisma.user.count().catch(() => 0),
      prisma.product.count().catch(() => 0),
      prisma.order.count().catch(() => 0),
      prisma.store.count().catch(() => 0),
      prisma.riderProfile.count().catch(() => 0),
      prisma.order
        .aggregate({
          _sum: {
            finalAmount: true,
          },
          where: {
            paymentStatus: "COMPLETED",
          },
        })
        .catch(() => ({ _sum: { finalAmount: 0 } })),
      prisma.order
        .count({
          where: {
            orderStatus: {
              notIn: ["DELIVERED", "CANCELLED"],
            },
          },
        })
        .catch(() => 0),
      prisma.delivery
        .count({
          where: {
            deliveryStatus: {
              in: ["ASSIGNED", "PICKED_UP"],
            },
          },
        })
        .catch(() => 0),
    ];

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalStores,
      totalRiders,
      totalRevenue,
      activeOrders,
      pendingDeliveries,
    ] = await Promise.all(statsPromises);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalStores,
        totalRiders,
        totalRevenue:
          typeof totalRevenue === "object"
            ? totalRevenue._sum.finalAmount || 0
            : totalRevenue,
        activeOrders,
        pendingDeliveries,
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
