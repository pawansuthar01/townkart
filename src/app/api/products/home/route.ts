import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get all available stores
    const availableStores = await prisma.store.findMany({
      where: { isActive: true, isVerified: true },
      select: { id: true },
    });
    const storeIds = availableStores.map((store) => store.id);

    if (storeIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
      });
    }

    // Get trending products: mix of high sales, featured, and new products
    const trendingProducts = await prisma.product.findMany({
      where: {
        storeInventory: {
          some: {
            storeId: { in: storeIds },
            stockQuantity: { gt: 0 },
            isAvailable: true,
          },
        },
        isAvailable: true,
        OR: [
          { totalSales: { gt: 10 } }, // Products with good sales
          { isFeatured: true },
          { isNew: true },
          { isOnSale: true },
        ],
      },
      include: {
        storeInventory: {
          where: {
            storeId: { in: storeIds },
            stockQuantity: { gt: 0 },
            isAvailable: true,
          },
          include: {
            store: {
              select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
                averageRating: true,
                totalOrders: true,
              },
            },
          },
        },

        images: {
          select: { url: true, alt: true, isPrimary: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      orderBy: [
        { totalSales: "desc" },
        { averageRating: "desc" },
        { createdAt: "desc" },
      ],
      take: limit * 2, // Get more to ensure diversity
    });
    // First, try to get diverse products with category limits
    const maxProductsPerCategory = Math.max(3, Math.ceil(limit / 10)); // Allow more products per category if needed
    const categoryProductCount: Record<string, number> = {};
    const selectedProducts: any[] = [];
    const usedProductIds = new Set<string>();

    // Phase 1: Get diverse products respecting category limits
    for (const product of trendingProducts) {
      const category = product.categoryName;
      if (!categoryProductCount[category]) {
        categoryProductCount[category] = 0;
      }

      if (
        categoryProductCount[category] < maxProductsPerCategory &&
        !usedProductIds.has(product.id)
      ) {
        selectedProducts.push(product);
        categoryProductCount[category]++;
        usedProductIds.add(product.id);

        if (selectedProducts.length >= limit) break;
      }
    }

    // Phase 2: If still need more products, relax category diversity
    if (selectedProducts.length < limit) {
      const remainingLimit = limit - selectedProducts.length;

      // Get remaining trending products not already selected
      const remainingProducts = trendingProducts.filter(
        (product) => !usedProductIds.has(product.id)
      );

      // Add remaining products up to the limit
      const additionalProducts = remainingProducts.slice(0, remainingLimit);
      selectedProducts.push(...additionalProducts);

      // Update used product IDs
      additionalProducts.forEach((product) => {
        usedProductIds.add(product.id);
      });
    }

    // Phase 3: If still need more, get any available products (fallback)
    if (selectedProducts.length < limit) {
      const remainingLimit = limit - selectedProducts.length;

      const fallbackProducts = await prisma.product.findMany({
        where: {
          storeInventory: {
            some: {
              storeId: { in: storeIds },
              stockQuantity: { gt: 0 },
              isAvailable: true,
            },
          },
          isAvailable: true,
          id: { notIn: Array.from(usedProductIds) },
        },

        include: {
          storeInventory: {
            where: {
              storeId: { in: storeIds },
              stockQuantity: { gt: 0 },
              isAvailable: true,
            },
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  latitude: true,
                  longitude: true,
                  averageRating: true,
                  totalOrders: true,
                },
              },
            },
          },

          images: {
            select: { url: true, alt: true, isPrimary: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
        orderBy: [
          { totalSales: "desc" },
          { averageRating: "desc" },
          { createdAt: "desc" },
        ],
        take: remainingLimit,
      });

      selectedProducts.push(...fallbackProducts);
    }

    // Shuffle for variety and apply pagination
    const shuffled = selectedProducts.sort(() => Math.random() - 0.5);
    const paginatedProducts = shuffled.slice((page - 1) * limit, page * limit);

    // Transform data for frontend
    const transformedProducts = paginatedProducts.map((product) => {
      const inventory = product.storeInventory[0];
      const imageUrls = product.images.map((img: any) => img.url);
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        description: product.description || "",
        categoryName: product.categoryName,
        price: product.price,
        discountedPrice: inventory?.discountedPrice || product.discountedPrice,
        stockQuantity: inventory?.stockQuantity || product.stockQuantity,
        isAvailable: (inventory?.stockQuantity || 0) > 0,
        averageRating: product.averageRating || 0,
        totalReviews: 0,
        totalSales: product.totalSales || 0,
        primaryImage: imageUrls[0] || null,
        images: imageUrls,
        store: inventory?.store
          ? {
              id: inventory.store.id,
              name: inventory.store.name,
              address: "",
              latitude: inventory.store.latitude,
              longitude: inventory.store.longitude,
              averageRating: inventory.store.averageRating,
            }
          : null,
        distance: 0,
        estimatedDeliveryTime: "N/A",
        isTrending:
          product.totalSales > 10 || product.isFeatured || product.isNew,
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.product.count({
      where: {
        storeInventory: {
          some: {
            storeId: { in: storeIds },
            stockQuantity: { gt: 0 },
            isAvailable: true,
          },
        },
        isAvailable: true,
        OR: [
          { totalSales: { gt: 10 } },
          { isFeatured: true },
          { isNew: true },
          { isOnSale: true },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      data: transformedProducts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Get home products error:", error);
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
