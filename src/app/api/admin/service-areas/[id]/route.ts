import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/admin/service-areas/[id] - Get service area by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.activeRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceArea = await prisma.serviceArea.findUnique({
      where: { id: params.id },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            isActive: true,
            totalOrders: true,
            latitude: true,
            longitude: true,
          },
        },
        _count: {
          select: {
            stores: true,
          },
        },
      },
    });

    if (!serviceArea) {
      return NextResponse.json(
        { error: "Service area not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: serviceArea,
    });
  } catch (error) {
    console.error("Error fetching service area:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/service-areas/[id] - Update service area
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.activeRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, city, state, centerLat, centerLng, radiusKm, isActive } =
      body;

    // Check if service area exists
    const existingArea = await prisma.serviceArea.findUnique({
      where: { id: params.id },
    });

    if (!existingArea) {
      return NextResponse.json(
        { error: "Service area not found" },
        { status: 404 },
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (centerLat !== undefined) updateData.centerLat = centerLat;
    if (centerLng !== undefined) updateData.centerLng = centerLng;
    if (radiusKm !== undefined) {
      updateData.radiusKm = radiusKm;
      // Recalculate bounds if radius changed
      updateData.bounds = calculateBounds(
        centerLat || existingArea.centerLat,
        centerLng || existingArea.centerLng,
        radiusKm,
      );
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const serviceArea = await prisma.serviceArea.update({
      where: { id: params.id },
      data: updateData,
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: serviceArea,
    });
  } catch (error) {
    console.error("Error updating service area:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/service-areas/[id] - Delete service area
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.activeRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if service area has associated stores
    const storeCount = await prisma.store.count({
      where: { serviceAreaId: params.id },
    });

    if (storeCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete service area with associated stores. Please reassign or delete stores first.",
        },
        { status: 400 },
      );
    }

    await prisma.serviceArea.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Service area deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service area:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
