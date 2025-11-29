import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("name") || searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "totalSales"; // totalSales, price, rating, createdAt
    const sortOrder = searchParams.get("sortOrder") || "desc"; // asc, desc

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Category name is required. Use ?name= or ?category= parameter",
        },
        { status: 400 },
      );
    }

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

    // Build orderBy object
    const orderBy: any = {};
    if (sortBy === "price") {
      orderBy.price = sortOrder;
    } else if (sortBy === "rating") {
      orderBy.averageRating = sortOrder;
    } else if (sortBy === "createdAt") {
      orderBy.createdAt = sortOrder;
    } else {
      // default to totalSales
      orderBy.totalSales = sortOrder;
    }

    const where: any = {
      storeInventory: {
        some: {
          storeId: { in: storeIds },
          stockQuantity: { gt: 0 },
          isAvailable: true,
        },
      },
      isAvailable: true,
      categoryName: {
        equals: category,
        mode: "insensitive",
      },
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
          _count: {
            select: { reviews: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Transform data for frontend
    const transformedProducts = products.map((product) => {
      const inventory = product.storeInventory[0];
      const imageUrls = product.images.map((img: any) => img.url);
      return {
        id: product.id,
        name: product.name,
        description: product.description || "",
        categoryName: product.categoryName,
        subcategory: product.subcategory,
        price: product.price,
        discountedPrice: inventory?.discountedPrice || product.discountedPrice,
        stockQuantity: inventory?.stockQuantity || product.stockQuantity,
        isAvailable: (inventory?.stockQuantity || 0) > 0,
        averageRating: product.averageRating || 0,
        totalReviews: product._count.reviews || 0,
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
        isFeatured: product.isFeatured,
        isNew: product.isNew,
        isOnSale: product.isOnSale,
        brand: product.brand,
        tags: product.tags,
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      category: category,
      sortBy,
      sortOrder,
    });
  } catch (error: any) {
    console.error("Get category products error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
