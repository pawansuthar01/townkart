import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get store manager's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
      include: {
        store: {
          include: {
            serviceArea: true,
          },
        },
      },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
      );
    }

    const storeId = storeStaff.storeId;

    // Get all offers and filter them in JavaScript
    const allOffers = await prisma.offer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Filter offers: store-created offers or admin offers applicable to this store
    const offers = allOffers.filter((offer) => {
      // If offer was created by this store, include it
      if (offer.createdBy === session.user.id) {
        return true;
      }

      // If offer was created by admin and applies to all stores or this specific store
      if (offer.createdBy !== session.user.id) {
        const merchantIds = offer.merchantIds as string[] | null;
        return !merchantIds || merchantIds.includes(storeId);
      }

      return false;
    });

    // Add store-specific information
    const offersWithStoreInfo = offers.map((offer) => ({
      ...offer,
      isLocationBased: offer.createdBy === session.user.id, // Store-created offers are location-based
      serviceAreaId: storeStaff.store.serviceAreaId,
      serviceArea: storeStaff.store.serviceArea,
    }));

    return NextResponse.json({
      success: true,
      offers: offersWithStoreInfo,
    });
  } catch (error) {
    console.error("Store offers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get store manager's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
      include: {
        store: true,
      },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      discountValue,
      maxDiscount,
      minOrderValue,
      applicableTo,
      productIds,
      categoryIds,
      targetUsers,
      userSegments,
      usageLimit,
      perUserLimit,
      couponCode,
      isAutoApply,
      startDate,
      endDate,
      priority,
      terms,
      isLocationBased,
    } = body;

    // Validate required fields
    if (!title || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // For store offers, limit applicability to store products only
    const limitedApplicableTo =
      applicableTo === "SPECIFIC_MERCHANTS"
        ? "ALL_PRODUCTS" // Convert to all products for this store
        : applicableTo;

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        title,
        description,
        type,
        discountValue: parseFloat(discountValue),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        minOrderValue: parseFloat(minOrderValue || 0),
        applicableTo: limitedApplicableTo,
        productIds: productIds ? JSON.stringify(productIds) : undefined,
        categoryIds: categoryIds ? JSON.stringify(categoryIds) : undefined,
        merchantIds: JSON.stringify([storeStaff.storeId]), // Only this store
        targetUsers,
        userSegments: userSegments ? JSON.stringify(userSegments) : undefined,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: parseInt(perUserLimit || 1),
        couponCode: couponCode || null,
        isAutoApply: Boolean(isAutoApply),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        priority: parseInt(priority || 0),
        terms,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error("Create store offer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
