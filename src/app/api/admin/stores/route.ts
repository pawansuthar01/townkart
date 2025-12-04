import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
      // where.applicationStatus = "PENDING"; // TODO: Uncomment after Prisma client regeneration
      where.isActive = false;
      where.managerId = { not: null };
    } else if (status) {
      where.isActive = status === "ACTIVE";
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
          return store.manager !== null;
        }
        return true;
      })
      .map((store) => ({
        id: store.id,
        name: store.name,
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
        managerId: { not: null }, // Only count stores with assigned managers
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
      // updateData.applicationStatus = "APPROVED"; // TODO: Uncomment after Prisma client regeneration
    } else if (action === "reject") {
      updateData.isActive = false;
      updateData.isVerified = false;
      // updateData.applicationStatus = "REJECTED"; // TODO: Uncomment after Prisma client regeneration
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

    // Get default service area (first one available)
    const defaultServiceArea = await prisma.serviceArea.findFirst({
      where: { isActive: true },
    });

    if (!defaultServiceArea) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No active service area found. Please create a service area first.",
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
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        category,
        managerId,
        serviceAreaId: defaultServiceArea.id,
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
