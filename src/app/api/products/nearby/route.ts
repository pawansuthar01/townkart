import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get("latitude");
    const longitude = searchParams.get("longitude");
    const maxDistance = searchParams.get("maxDistance");
    const query = searchParams.get("query");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const sortBy = searchParams.get("sortBy") || "distance";

    // Build where clause
    const where: any = {
      isAvailable: true,
      storeInventory: {
        some: {
          stockQuantity: { gt: 0 },
          store: {
            isActive: true,
            ...(latitude && longitude && maxDistance
              ? {
                  AND: [
                    {
                      latitude: {
                        gte:
                          parseFloat(latitude) -
                          parseFloat(maxDistance) / 111.32, // Rough conversion km to degrees
                        lte:
                          parseFloat(latitude) +
                          parseFloat(maxDistance) / 111.32,
                      },
                    },
                    {
                      longitude: {
                        gte:
                          parseFloat(longitude) -
                          parseFloat(maxDistance) /
                            (111.32 *
                              Math.cos((parseFloat(latitude) * Math.PI) / 180)),
                        lte:
                          parseFloat(longitude) +
                          parseFloat(maxDistance) /
                            (111.32 *
                              Math.cos((parseFloat(latitude) * Math.PI) / 180)),
                      },
                    },
                  ],
                }
              : {}),
          },
        },
      },
    };

    // Add search query
    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { categoryName: { contains: query, mode: "insensitive" } },
      ];
    }

    // Add category filter
    if (category) {
      where.categoryName = category;
    }

    // Calculate distance for sorting if location provided
    let orderBy: any = { createdAt: "desc" };

    if (sortBy === "distance" && latitude && longitude) {
      // For distance sorting, we'll need to calculate in JavaScript after fetching
      // For now, sort by creation date
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "price-low") {
      orderBy = { price: "asc" };
    } else if (sortBy === "price-high") {
      orderBy = { price: "desc" };
    } else if (sortBy === "rating") {
      orderBy = { averageRating: "desc" };
    } else if (sortBy === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (sortBy === "popular") {
      orderBy = { totalSales: "desc" };
    }

    // Fetch products with store information
    const products = await prisma.product.findMany({
      where,
      include: {
        storeInventory: {
          include: {
            store: {
              select: {
                id: true,
                name: true,
                address: true,
                latitude: true,
                longitude: true,
                averageRating: true,
                isVerified: true,
              },
            },
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: { url: true, alt: true, isPrimary: true },
          orderBy: { sortOrder: "asc" },
          take: 3,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            sales: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: (page - 1) * limit,
    });

    // Get total count
    const total = await prisma.product.count({ where });

    // Transform products and calculate distances
    const transformedProducts = products.map((product) => {
      const store = product.storeInventory?.[0]?.store;
      let distance: string | undefined;

      if (latitude && longitude && store?.latitude && store?.longitude) {
        const distanceKm = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          store.latitude,
          store.longitude
        );
        distance = `${distanceKm.toFixed(1)} km`;
      }

      // Calculate average rating from reviews
      const totalRating = product.reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const averageRating =
        product.reviews.length > 0 ? totalRating / product.reviews.length : 0;

      const images = product.images || [];
      const primaryImage =
        images.find((img) => img.isPrimary)?.url || images[0]?.url || null;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        discountedPrice: product.discountedPrice,
        stockQuantity: product.stockQuantity,
        categoryName: product.categoryName,
        subcategory: product.subcategory,
        brand: product.brand,
        isAvailable: product.isAvailable,
        isFeatured: product.isFeatured,
        isNew: product.isNew,
        isOnSale: product.isOnSale,
        averageRating: averageRating || product.averageRating,
        totalReviews: product._count.reviews,
        totalSales: product._count.sales,
        primaryImage,
        images: images.map((img) => img.url),
        store: store
          ? {
              ...store,
              distance,
              deliveryTime: getDeliveryTime(product.categoryName),
            }
          : null,
      };
    });

    // Sort by distance if requested and location provided
    if (sortBy === "distance" && latitude && longitude) {
      transformedProducts.sort((a, b) => {
        const distA = a.store?.distance
          ? parseFloat(a.store.distance)
          : Infinity;
        const distB = b.store?.distance
          ? parseFloat(b.store.distance)
          : Infinity;
        return distA - distB;
      });
    }

    return NextResponse.json({
      success: true,
      data: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Nearby products error:", error);
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

// Helper function to calculate distance between two points
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper function to get delivery time based on category
function getDeliveryTime(category: string): string {
  const times: { [key: string]: string } = {
    Grocery: "30 mins",
    Food: "45 mins",
    Medicine: "20 mins",
    Electronics: "1-2 hours",
    Fashion: "1 hour",
    Household: "50 mins",
  };
  return times[category] || "45 mins";
}
