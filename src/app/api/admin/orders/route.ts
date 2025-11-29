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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userRoles: true },
    });

    if (!user?.userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};

    if (status && status !== "ALL") {
      where.orderStatus = status;
    }

    if (paymentStatus && paymentStatus !== "ALL") {
      where.paymentStatus = paymentStatus;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
          },
        },
        payment: {
          select: {
            paymentStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Transform data for frontend
    const transformedOrders = orders.map((order) => ({
      id: order.orderNumber,
      customer: order.customer.fullName,
      store: order.store.name,
      total: order.finalAmount,
      status: order.orderStatus,
      paymentStatus: order.payment?.paymentStatus || "PENDING",
      date: order.createdAt.toISOString().split("T")[0],
      items: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    }));

    // Calculate stats
    const stats = {
      totalOrders: transformedOrders.length,
      delivered: transformedOrders.filter((o) => o.status === "DELIVERED")
        .length,
      inTransit: transformedOrders.filter((o) => o.status === "EN_ROUTE")
        .length,
      pendingPayment: transformedOrders.filter(
        (o) => o.paymentStatus === "PENDING",
      ).length,
    };

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
      stats,
    });
  } catch (error) {
    console.error("Admin orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
