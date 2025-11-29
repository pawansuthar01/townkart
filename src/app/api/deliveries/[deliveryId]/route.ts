import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { deliveryId: string } },
) {
  try {
    const deliveryId = params.deliveryId;

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                addresses: true,
              },
            },
            store: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                phoneNumber: true,
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
        rider: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Delivery not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(delivery);
  } catch (error) {
    console.error("Error fetching delivery:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { deliveryId: string } },
) {
  try {
    const deliveryId = params.deliveryId;
    const body = await request.json();

    const delivery = await prisma.delivery.update({
      where: { id: deliveryId },
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
            store: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(delivery);
  } catch (error) {
    console.error("Error updating delivery:", error);
    return NextResponse.json(
      { error: "Failed to update delivery" },
      { status: 500 },
    );
  }
}
