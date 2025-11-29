import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { couponCode, cartTotal, userId } = await request.json();

    if (!couponCode || !cartTotal) {
      return NextResponse.json(
        {
          success: false,
          message: "Coupon code and cart total are required",
        },
        { status: 400 },
      );
    }

    // Find the coupon/offer
    const offer = await prisma.offer.findFirst({
      where: {
        couponCode: couponCode.toUpperCase(),
        isActive: true,
      },
    });

    if (!offer) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired coupon code",
        },
        { status: 400 },
      );
    }

    // Check minimum order value
    if (cartTotal < offer.minOrderValue) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order value of ₹${offer.minOrderValue} required`,
        },
        { status: 400 },
      );
    }

    // Check usage limits if user is provided
    if (userId) {
      const usageCount = await prisma.order.count({
        where: {
          customerId: userId,
          offers: {
            some: {
              id: offer.id,
            },
          },
          orderStatus: {
            notIn: ["CANCELLED"],
          },
        },
      });

      if (offer.perUserLimit && usageCount >= offer.perUserLimit) {
        return NextResponse.json(
          {
            success: false,
            message: "Coupon usage limit exceeded",
          },
          { status: 400 },
        );
      }
    }

    // Calculate discount
    let discount = 0;
    if (offer.type === "PERCENTAGE_DISCOUNT") {
      discount = Math.min(
        cartTotal * (offer.discountValue / 100),
        offer.maxDiscount || Infinity,
      );
    } else if (offer.type === "FIXED_DISCOUNT") {
      discount = Math.min(offer.discountValue, cartTotal);
    }

    return NextResponse.json({
      success: true,
      data: {
        couponCode: offer.couponCode,
        discountType: offer.type,
        discountValue: offer.discountValue,
        maxDiscount: offer.maxDiscount,
        discount: Math.round(discount * 100) / 100, // Round to 2 decimal places
        description: offer.description,
        minOrderValue: offer.minOrderValue,
      },
    });
  } catch (error: any) {
    console.error("Coupon validation error:", error);
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
