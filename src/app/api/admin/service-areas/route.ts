import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/admin/service-areas - Get all service areas
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.activeRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceAreas = await prisma.serviceArea.findMany({
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            isActive: true,
            totalOrders: true,
          },
        },
        _count: {
          select: {
            stores: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: serviceAreas,
    });
  } catch (error: any) {
    console.error("Error fetching service areas:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/service-areas - Create new service area
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.activeRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      city,
      state,
      centerLat,
      centerLng,
      radiusKm,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !city || !state || !centerLat || !centerLng || !radiusKm) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Calculate bounding box
    const bounds = calculateBounds(centerLat, centerLng, radiusKm);

    const serviceArea = await prisma.serviceArea.create({
      data: {
        name,
        city,
        state,
        centerLat,
        centerLng,
        radiusKm,
        bounds,
        isActive,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: serviceArea,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating service area:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Calculate bounding box for a circular area
 */
function calculateBounds(
  centerLat: number,
  centerLng: number,
  radiusKm: number,
) {
  const latChange = radiusKm / 111.32; // 1 degree ≈ 111.32 km
  const lngChange = Math.abs(
    radiusKm / (111.32 * Math.cos((centerLat * Math.PI) / 180)),
  );

  return {
    north: centerLat + latChange,
    south: centerLat - latChange,
    east: centerLng + lngChange,
    west: centerLng - lngChange,
  };
}
