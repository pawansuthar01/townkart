import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// DELETE /api/wishlist/[productId] - Remove item from wishlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { productId } = params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    // Remove from wishlist
    const deletedItem = await prisma.wishlistItem.deleteMany({
      where: {
        userId: session.user.id,
        productId: productId,
      },
    });

    if (deletedItem.count === 0) {
      return NextResponse.json(
        { error: "Item not found in wishlist" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json(
      { error: "Failed to remove from wishlist" },
      { status: 500 },
    );
  }
}
