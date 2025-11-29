import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const { productId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "newest"; // newest, oldest, highest, lowest
    const rating = searchParams.get("rating"); // filter by rating

    const where: any = {
      productId,
    };

    // Add rating filter if specified
    if (rating) {
      where.rating = parseInt(rating);
    }

    // Determine sort order
    let orderBy: any = { createdAt: "desc" }; // default: newest first
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "highest":
        orderBy = { rating: "desc" };
        break;
      case "lowest":
        orderBy = { rating: "asc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    // Get reviews with pagination
    const reviews = await prisma.productReview.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            profileImageUrl: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count for pagination
    const totalReviews = await prisma.productReview.count({
      where,
    });

    // Get rating distribution
    const ratingStats = await prisma.productReview.groupBy({
      by: ["rating"],
      where: { productId },
      _count: {
        rating: true,
      },
    });

    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratingStats.forEach((stat) => {
      ratingDistribution[stat.rating as keyof typeof ratingDistribution] =
        stat._count.rating;
    });

    // Calculate average rating
    const totalRatingSum = Object.entries(ratingDistribution).reduce(
      (sum, [rating, count]) => sum + parseInt(rating) * count,
      0,
    );
    const averageRating = totalReviews > 0 ? totalRatingSum / totalReviews : 0;

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page,
          limit,
          total: totalReviews,
          totalPages: Math.ceil(totalReviews / limit),
        },
        stats: {
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(1)),
          ratingDistribution,
        },
      },
    });
  } catch (error: any) {
    console.error("Get product reviews error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const { productId } = params;
    const body = await request.json();
    const { rating, title, comment, pros, cons, images, orderId } = body;

    // TODO: Add authentication check
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // For now, use a dummy user ID
    const customerId = "dummy-user-id";

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.productReview.findFirst({
      where: {
        productId,
        customerId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: "You have already reviewed this product" },
        { status: 400 },
      );
    }

    // Create the review
    const review = await prisma.productReview.create({
      data: {
        productId,
        customerId,
        orderId,
        rating,
        title,
        comment,
        pros,
        cons,
        images,
        isVerified: !!orderId, // Mark as verified if orderId is provided
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    // Update product average rating
    const allReviews = await prisma.productReview.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating,
        totalReviews: allReviews.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
    });
  } catch (error: any) {
    console.error("Create product review error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
