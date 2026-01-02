import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { a } from "node_modules/framer-motion/dist/types.d-BJcRxCew";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const type = searchParams.get("type") || "active"; // "active" or "pending"

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (type === "pending") {
      where.applicationStatus = "PENDING";
      where.isActive = false;
      where.managerId = { not: null };
    } else {
      // For active stores, include both approved active stores and pending stores
      where.OR = [
        { applicationStatus: "APPROVED", isActive: true },
        {
          applicationStatus: "PENDING",
          isActive: false,
          managerId: { not: null },
        },
      ];
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { manager: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Get stores with manager info
    const stores = await prisma.store.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    // Transform data and filter out stores without managers for pending applications
    const transformedStores = stores
      .filter((store) => {
        // For pending applications, ensure manager exists
        if (type === "pending") {
          return (
            store.manager !== null || store.applicationStatus === "PENDING"
          );
        }
        return true;
      })
      .map((store) => ({
        id: store.id,
        name: store.name,
        applicationStatus: store.applicationStatus,
        code: store.code,
        description: store.description,
        category: store.category,
        address: store.address,
        city: store.city,
        state: store.state,
        pincode: store.pincode,
        latitude: store.latitude,
        longitude: store.longitude,
        manager: store.manager
          ? {
              id: store.manager.id,
              name: store.manager.fullName || "N/A",
              email: store.manager.email || "N/A",
              phone: store.manager.phoneNumber || "N/A",
            }
          : null,
        isActive: store.isActive,
        isVerified: store.isVerified,
        averageRating: store.averageRating,
        totalOrders: store.totalOrders,
        totalRevenue: store.totalRevenue,
        createdAt: store.createdAt,
        ordersCount: store._count.orders,
      }));

    // Update total count after filtering
    const filteredTotal = transformedStores.length;

    const pendingCount = await prisma.store.count({
      where: {
        isActive: false,
        applicationStatus: "PENDING",
        managerId: { not: null },
      },
    });

    // Debug: Log what stores are being returned for pending
    if (type === "pending") {
      console.log("Pending stores query result:", {
        originalTotal: stores.length,
        filteredTotal,
        stores: transformedStores.map((s) => ({
          id: s.id,
          name: s.name,
          isActive: s.isActive,
          hasManager: !!s.manager,
          managerId: s.manager?.id,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      data: transformedStores,
      pendingCount,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
    });
  } catch (error: any) {
    console.error("Get stores error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Find the service area that contains the given location
 */
async function findServiceAreaForLocation(latitude: number, longitude: number) {
  const serviceAreas = await prisma.serviceArea.findMany({
    where: { isActive: true },
  });

  for (const area of serviceAreas) {
    // Check if the point is within the service area bounds
    const bounds = area.bounds as {
      north: number;
      south: number;
      east: number;
      west: number;
    };

    if (
      bounds &&
      latitude >= bounds.south &&
      latitude <= bounds.north &&
      longitude >= bounds.west &&
      longitude <= bounds.east
    ) {
      // Calculate distance from center to verify it's within radius
      const distance = calculateDistance(
        latitude,
        longitude,
        area.centerLat,
        area.centerLng
      );

      if (distance <= area.radiusKm) {
        return area;
      }
    }
  }

  return null;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("id");
    const action = searchParams.get("action");

    if (!storeId || !["approve", "reject"].includes(action || "")) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (action === "approve") {
      updateData.isActive = true;
      updateData.isVerified = true;
      updateData.applicationStatus = "APPROVED";
    } else if (action === "reject") {
      updateData.isActive = false;
      updateData.isVerified = false;
      updateData.applicationStatus = "REJECTED";
    }

    const store = await prisma.store.update({
      where: { id: storeId },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: store,
    });
  } catch (error: any) {
    console.error("Update store error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      description,
      address,
      city,
      state,
      pincode,
      latitude,
      longitude,
      category,
      managerId,
    } = body;

    // Validate required fields
    if (!name || !code || !address || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if store code already exists
    const existingStore = await prisma.store.findUnique({
      where: { code },
    });

    if (existingStore) {
      return NextResponse.json(
        { success: false, message: "Store code already exists" },
        { status: 400 }
      );
    }

    // Validate latitude and longitude
    const storeLat = parseFloat(latitude);
    const storeLng = parseFloat(longitude);

    if (
      !storeLat ||
      !storeLng ||
      storeLat < -90 ||
      storeLat > 90 ||
      storeLng < -180 ||
      storeLng > 180
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid latitude or longitude coordinates",
        },
        { status: 400 }
      );
    }

    // Find service area based on location
    const serviceArea = await findServiceAreaForLocation(storeLat, storeLng);

    if (!serviceArea) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No service area found for the specified location. Please create a service area that covers this location first.",
        },
        { status: 400 }
      );
    }

    // Create store
    const store = await prisma.store.create({
      data: {
        name,
        code,
        description,
        address,
        city,
        state,
        pincode,
        latitude: storeLat,
        longitude: storeLng,
        category,
        managerId,
        serviceAreaId: serviceArea.id,
      },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: store,
    });
  } catch (error: any) {
    console.error("Create store error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
