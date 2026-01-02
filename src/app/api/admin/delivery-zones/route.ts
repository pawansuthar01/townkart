import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const zones = await prisma.deliveryZone.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: zones,
    });
  } catch (error: any) {
    console.error("Get delivery zones error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      code,
      boundaries,
      centerLat,
      centerLng,
      radiusKm,
      baseDeliveryFee,
      perKmFee,
      maxRadius,
    } = await request.json();

    if (!name || !code || !boundaries || !centerLat || !centerLng) {
      return NextResponse.json(
        { error: "Name, code, boundaries, center coordinates are required" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingZone = await prisma.deliveryZone.findUnique({
      where: { code },
    });

    if (existingZone) {
      return NextResponse.json(
        { error: "Zone code already exists" },
        { status: 409 }
      );
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        name,
        code,
        boundaries,
        centerLat,
        centerLng,
        radiusKm: radiusKm || 10,
        baseDeliveryFee: baseDeliveryFee || 20,
        perKmFee: perKmFee || 5,
        maxRadius: maxRadius || 10,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: zone,
        message: "Delivery zone created successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create delivery zone error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
