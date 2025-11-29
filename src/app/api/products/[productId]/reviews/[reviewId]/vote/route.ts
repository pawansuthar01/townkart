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
    const { isHelpful } = await request.json();

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

    // Update the helpful votes count
    await prisma.productReview.update({
      where: { id: reviewId },
      data: {
        isHelpful: {
          increment: isHelpful ? 1 : -1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Vote recorded successfully",
    });
  } catch (error: any) {
    console.error("Vote review error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
