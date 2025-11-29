import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { shopId: string } },
) {
  try {
    const { shopId } = params;

    const store = await prisma.store.findUnique({
      where: {
        id: shopId,
        isActive: true,
        isVerified: true,
      },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: {
            orders: true,
            inventory: true,
          },
        },
        // Include reviews/ratings if available
        reviews: {
          select: {
            id: true,
            storeRating: true,
            riderRating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Latest 10 reviews
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { success: false, message: "Store not found" },
        { status: 404 },
      );
    }

    // Get store products
    const products = await prisma.product.findMany({
      where: {
        storeInventory: {
          some: {
            storeId: shopId,
            stockQuantity: { gt: 0 },
          },
        },
        isAvailable: true,
      },
      take: 20,
      select: {
        id: true,
        name: true,
        price: true,
        discountedPrice: true,
        images: true,
        description: true,
        category: true,
        slug: true,
      },
    });

    // Get store offers/promotions
    const offers = await prisma.offer.findMany({
      where: {
        OR: [
          { merchantIds: { string_contains: shopId } },
          { applicableTo: "ALL_PRODUCTS" },
        ],
        isActive: true,
        endDate: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        discountValue: true,
        minOrderValue: true,
        couponCode: true,
        endDate: true,
      },
      take: 5,
    });

    // Calculate average rating
    const totalReviews = store.reviews.length;
    const averageRating =
      totalReviews > 0
        ? store.reviews.reduce(
            (sum, review) => sum + (review.storeRating || 0),
            0,
          ) / totalReviews
        : 0;

    const storeDetails = {
      id: store.id,
      name: store.name,
      description: store.description,
      address: store.address,
      city: store.city,
      state: store.state,
      pincode: store.pincode,
      latitude: store.latitude,
      longitude: store.longitude,
      category: store.category,
      subcategory: store.subcategory,
      phoneNumber: store.phoneNumber,
      email: store.email,
      operatingHours: store.operatingHours,
      averageRating: averageRating.toFixed(1),
      totalReviews,
      totalOrders: store._count.orders,
      totalProducts: store._count.inventory,
      isOpen: isStoreOpen(store.operatingHours),
      products,
      offers,
      reviews: store.reviews,
      createdAt: store.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: storeDetails,
    });
  } catch (error: any) {
    console.error("Get store details error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

function isStoreOpen(operatingHours: any): boolean {
  if (!operatingHours) return true; // Assume open if no hours specified

  const now = new Date();
  const currentDay = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format

  const todayHours = operatingHours[currentDay];
  if (!todayHours || !todayHours.open || !todayHours.close) return false;

  const openTime = parseTime(todayHours.open);
  const closeTime = parseTime(todayHours.close);

  return currentTime >= openTime && currentTime <= closeTime;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 100 + minutes;
}
