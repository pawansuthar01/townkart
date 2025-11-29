import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get real statistics from database
    const [
      totalUsers,
      totalStores,
      totalOrders,
      totalRevenue,
      activeDeliveries,
      totalRiders,
    ] = await Promise.all([
      // Total users (customers + STORE_MANAGER + riders)
      prisma.user.count({
        where: {
          activeRole: {
            in: ["CUSTOMER", "STORE_MANAGER", "RIDER"],
          },
        },
      }),

      // Total active stores
      prisma.store.count({
        where: { isActive: true },
      }),

      // Total completed orders
      prisma.order.count({
        where: {
          orderStatus: "DELIVERED",
        },
      }),

      // Total revenue from completed orders
      prisma.order.aggregate({
        where: {
          orderStatus: "DELIVERED",
        },
        _sum: {
          finalAmount: true,
        },
      }),

      // Active deliveries
      prisma.delivery.count({
        where: {
          deliveryStatus: {
            in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"],
          },
        },
      }),

      // Total active riders
      prisma.user.count({
        where: {
          activeRole: "RIDER",
          isActive: true,
        },
      }),
    ]);

    const stats = [
      {
        number: `${(totalUsers / 1000).toFixed(0)}K+`,
        label: "Happy Customers",
        icon: "Users",
      },
      {
        number: `${totalStores}+`,
        label: "Partner Stores",
        icon: "Store",
      },
      {
        number: `${(totalOrders / 1000).toFixed(0)}K+`,
        label: "Orders Delivered",
        icon: "Truck",
      },
      {
        number: "4.8",
        label: "Average Rating",
        icon: "Star",
      },
    ];

    return NextResponse.json({
      success: true,
      data: stats,
      rawData: {
        totalUsers,
        totalStores,
        totalOrders,
        totalRevenue: totalRevenue._sum.finalAmount || 0,
        activeDeliveries,
        totalRiders,
      },
    });
  } catch (error: any) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
