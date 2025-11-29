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
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      storeId: storeStaff.storeId,
    };

    if (status) {
      where.orderStatus = status;
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
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Transform orders for frontend
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.fullName || "Unknown Customer",
      customerPhone: order.customer.phoneNumber,
      items: order.orderItems.length,
      total: order.finalAmount,
      status: order.orderStatus,
      createdAt: order.createdAt.toISOString(),
      deliveryAddress:
        typeof order.deliveryAddress === "string"
          ? order.deliveryAddress
          : JSON.stringify(order.deliveryAddress),
      specialInstructions: order.specialInstructions,
    }));

    return NextResponse.json({
      success: true,
      orders: transformedOrders,
    });
  } catch (error) {
    console.error("Store orders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
