import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string; reviewId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, reviewId } = params;
    const { reason } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Report reason is required" },
        { status: 400 },
      );
    }

    // Check if review exists and belongs to the product
    const review = await prisma.productReview.findFirst({
      where: {
        id: reviewId,
        productId: productId,
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 },
      );
    }

    // Mark the review as reported
    await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        isReported: true,
        reportReason: reason,
      },
    });

    // TODO: You might want to create a separate ReviewReport table to track multiple reports
    // For now, we'll just mark the review as reported

    return NextResponse.json({
      success: true,
      message: "Review reported successfully",
    });
  } catch (error: any) {
    console.error("Report review error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
