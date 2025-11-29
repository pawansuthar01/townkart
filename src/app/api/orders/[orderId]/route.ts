import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } },
) {
  try {
    const orderId = params.orderId;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
        merchant: {
          select: {
            id: true,
            businessName: true,
            address: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                brand: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                attributes: true,
              },
            },
          },
        },
        delivery: {
          include: {
            rider: {
              select: {
                id: true,
                rating: true,
              },
            },
          },
        },
        review: {
          select: {
            id: true,
            merchantRating: true,
            riderRating: true,
            comment: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
