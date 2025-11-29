import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const productId = searchParams.get("productId");
    const merchantId = searchParams.get("merchantId");

    // Get all active offers that are currently valid
    const now = new Date();
    const baseWhere = {
      isActive: true,
      startDate: {
        lte: now,
      },
      endDate: {
        gte: now,
      },
    };

    // Build dynamic where clause based on targeting
    const whereConditions: any[] = [baseWhere];

    // If userId is provided, filter offers targeted to this user or all users
    if (userId) {
      whereConditions.push({
        OR: [
          { targetUsers: "ALL_USERS" },
          { targetUsers: "NEW_USERS" },
          { targetUsers: "RETURNING_USERS" },
          { targetUsers: "LOYAL_CUSTOMERS" },
          { targetUsers: "FIRST_TIME_USERS" },
          {
            targetUsers: "SPECIFIC_USERS",
            userIds: {
              has: userId,
            },
          },
        ],
      });
    }

    // If productId is provided, filter offers applicable to this product
    if (productId) {
      // First get the product with its store information through inventory
      const productWithStore = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          categoryId: true,
          storeInventory: {
            select: {
              storeId: true,
            },
          },
        },
      });

      if (productWithStore) {
        const storeId = productWithStore.storeInventory?.[0]?.storeId;

        whereConditions.push({
          OR: [
            { applicableTo: "ALL_PRODUCTS" },
            {
              applicableTo: "SPECIFIC_PRODUCTS",
              productIds: {
                has: productId,
              },
            },
            {
              applicableTo: "SPECIFIC_CATEGORIES",
              categoryIds: {
                has: productWithStore.categoryId,
              },
            },
            ...(storeId
              ? [
                  {
                    applicableTo: "SPECIFIC_MERCHANTS",
                    merchantIds: {
                      has: storeId,
                    },
                  },
                ]
              : []),
          ],
        });
      }
    }

    // If merchantId is provided, filter offers for this merchant
    if (merchantId) {
      whereConditions.push({
        OR: [
          { applicableTo: "ALL_PRODUCTS" },
          {
            applicableTo: "SPECIFIC_MERCHANTS",
            merchantIds: {
              has: merchantId,
            },
          },
        ],
      });
    }

    const offers = await prisma.offer.findMany({
      where: {
        AND: whereConditions,
      },
      include: {
        // Include related data if needed
      },
      orderBy: {
        priority: "desc", // Higher priority first
      },
    });

    // Transform offers for public display
    const transformedOffers = offers.map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      type: offer.type,
      discountValue: offer.discountValue,
      maxDiscount: offer.maxDiscount,
      minOrderValue: offer.minOrderValue,
      applicableTo: offer.applicableTo,
      targetUsers: offer.targetUsers,
      usedCount: offer.usedCount,
      couponCode: offer.couponCode,
      isAutoApply: offer.isAutoApply,
      startDate: offer.startDate.toISOString(),
      endDate: offer.endDate.toISOString(),
      isActive: offer.isActive,
      priority: offer.priority,
      terms: offer.terms,
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
      // Add some mock display data for now
      storeName: "TownKart Store",
      storeRating: 4.5,
      storeDistance: "1.2 km",
    }));

    return NextResponse.json({
      success: true,
      offers: transformedOffers,
    });
  } catch (error) {
    console.error("Offers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
