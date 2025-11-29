import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Product slug is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: slug },
          { id: slug }, // Fallback to ID if slug is actually an ID
        ],
      },
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

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Get counts separately
    const reviewCount = await prisma.productReview.count({
      where: { productId: product.id },
    });

    const salesCount = await prisma.productSales.count({
      where: { productId: product.id },
    });

    // Transform data for frontend
    const store = product.storeInventory?.[0]?.store;
    const images = product.images || [];
    const primaryImage =
      images.find((img) => img.isPrimary)?.url || images[0]?.url || null;

    // Calculate average rating from reviews
    const totalRating = product.reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    const averageRating =
      product.reviews.length > 0 ? totalRating / product.reviews.length : 0;

    const transformedProduct = {
      ...product,
      store,
      totalReviews: reviewCount,
      totalSales: salesCount,
      averageRating: averageRating || product.averageRating,
      primaryImage,
      images: images.map((img) => img.url),
      storeInventory: undefined, // Remove storeInventory from response
    };

    return NextResponse.json({
      success: true,
      data: transformedProduct,
    });
  } catch (error: any) {
    console.error("Get product by slug error:", error);
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
