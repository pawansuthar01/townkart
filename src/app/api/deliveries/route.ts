import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const riderId = searchParams.get("riderId");
    const status = searchParams.get("status");

    let where: any = {};

    if (riderId) {
      where.riderId = riderId;
    }

    if (status) {
      where.deliveryStatus = status;
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
            merchant: {
              select: {
                id: true,
                businessName: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(deliveries);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliveries" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const delivery = await prisma.delivery.create({
      data: body,
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
            merchant: {
              select: {
                id: true,
                businessName: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
    });
    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error("Error creating delivery:", error);
    return NextResponse.json(
      { error: "Failed to create delivery" },
      { status: 500 },
    );
  }
}
