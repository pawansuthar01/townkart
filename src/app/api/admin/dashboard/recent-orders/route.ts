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

    // Get recent orders
    const recentOrders = await prisma.order
      .findMany({
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
      })
      .catch(() => []);

    return NextResponse.json({
      success: true,
      data: recentOrders.map((order) => ({
        id: order.id,
        customer: order.customer.fullName,
        store: order.store.name,
        total: order.finalAmount,
        status: order.orderStatus,
        date: order.createdAt.toISOString().split("T")[0],
      })),
    });
  } catch (error) {
    console.error("Admin dashboard recent orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch recent orders" },
      { status: 500 }
    );
  }
}
