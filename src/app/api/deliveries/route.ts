import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const riderId = searchParams.get("riderId");
    const status = searchParams.get("status");
    const available = searchParams.get("available");

    let where: any = {};

    // If requesting available deliveries, only show unassigned ones
    if (available === "true") {
      where.riderId = null; // Only unassigned deliveries
      where.deliveryStatus = "ASSIGNED"; // Only assigned but not picked up
    } else if (riderId) {
      // For rider-specific queries, ensure rider can only see their own deliveries
      if (session.user.activeRole === "RIDER") {
        // Get rider profile ID
        const riderProfile = await prisma.riderProfile.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        });

        if (!riderProfile) {
          return NextResponse.json(
            { error: "Rider profile not found" },
            { status: 404 }
          );
        }

        where.riderId = riderProfile.id;
      } else {
        // Admin can see any rider's deliveries
        where.riderId = riderId;
      }
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
            store: {
              select: {
                id: true,
                name: true,
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
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.activeRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

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
    return NextResponse.json(delivery, { status: 201 });
  } catch (error) {
    console.error("Error creating delivery:", error);
    return NextResponse.json(
      { error: "Failed to create delivery" },
      { status: 500 }
    );
  }
}
