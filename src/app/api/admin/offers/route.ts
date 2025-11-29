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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userRoles: true },
    });

    if (!user?.userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const offers = await prisma.offer.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error("Admin offers error:", error);
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { userRoles: true },
    });

    if (!user?.userRoles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      merchantIds,
      targetUsers,
      userIds,
      userSegments,
      usageLimit,
      perUserLimit,
      couponCode,
      isAutoApply,
      startDate,
      endDate,
      priority,
      terms,
    } = body;

    // Validate required fields
    if (!title || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        title,
        description,
        type,
        discountValue: parseFloat(discountValue),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        minOrderValue: parseFloat(minOrderValue || 0),
        applicableTo,
        productIds: productIds ? JSON.stringify(productIds) : undefined,
        categoryIds: categoryIds ? JSON.stringify(categoryIds) : undefined,
        merchantIds: merchantIds ? JSON.stringify(merchantIds) : undefined,
        targetUsers,
        userIds: userIds ? JSON.stringify(userIds) : undefined,
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
    console.error("Create offer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
