import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const latitude = parseFloat(searchParams.get("latitude") || "0");
    const longitude = parseFloat(searchParams.get("longitude") || "0");
    const radius = parseFloat(searchParams.get("radius") || "10"); // 10km default
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: any = {
      isActive: true,
      isVerified: true,
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    // Get all stores first
    const stores = await prisma.store.findMany({
      where,
      include: {
        manager: {
          select: { id: true, phoneNumber: true },
        },
        _count: {
          select: { orders: true, inventory: true },
        },
      },
    });

    // Filter by distance if coordinates provided
    let filteredStores = stores;
    if (latitude && longitude) {
      filteredStores = stores.filter((store) => {
        if (!store.latitude || !store.longitude) return false;

        const distance = calculateDistance(
          latitude,
          longitude,
          store.latitude,
          store.longitude,
        );

        // Add distance to store object for sorting
        (store as any).distance = distance;
        return distance <= radius;
      });

      // Sort by distance
      filteredStores.sort((a, b) => (a as any).distance - (b as any).distance);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStores = filteredStores.slice(startIndex, endIndex);

    // Get products for each store
    const storesWithProducts = await Promise.all(
      paginatedStores.map(async (store) => {
        const products = await prisma.product.findMany({
          where: {
            storeInventory: {
              some: {
                storeId: store.id,
                stockQuantity: { gt: 0 },
              },
            },
            isAvailable: true,
          },
          take: 5, // Limit to 5 products per store
          select: {
            id: true,
            name: true,
            price: true,
            discountedPrice: true,
            images: true,
          },
        });

        return {
          ...store,
          products,
          distance: (store as any).distance,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: storesWithProducts,
      pagination: {
        page,
        limit,
        total: filteredStores.length,
        totalPages: Math.ceil(filteredStores.length / limit),
      },
    });
  } catch (error: any) {
    console.error("Get shops error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}
