import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = params.productId;

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
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
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            discountedPrice: true,
            stockQuantity: true,
            attributes: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            isPrimary: true,
            sortOrder: true,
          },
          orderBy: { sortOrder: "asc" },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Get counts separately
    const reviewCount = await prisma.productReview.count({
      where: { productId },
    });

    const salesCount = await prisma.productSales.count({
      where: { productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Transform data for frontend
    const images = product.images || [];
    const primaryImage =
      images.find((img) => img.isPrimary)?.url || images[0]?.url || null;
    const store = product.storeInventory?.[0]?.store || null;

    const transformedProduct = {
      ...product,
      store,
      totalReviews: reviewCount,
      totalSales: salesCount,
      primaryImage,
      images: images.map((img) => img.url),
      storeInventory: undefined, // Remove storeInventory from response
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
    });
  } catch (error: any) {
    console.error("Get product error:", error);
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
