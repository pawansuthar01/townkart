import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// GET /api/wishlist - Get user's wishlist
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discountedPrice: true,
            images: {
              select: {
                url: true,
                isPrimary: true,
              },
              orderBy: { sortOrder: "asc" },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match the expected format
    const formattedItems = wishlistItems.map((item) => {
      const primaryImage =
        item.product.images.find((img: any) => img.isPrimary)?.url ||
        item.product.images[0]?.url ||
        "";
      return {
        id: item.product.id,
        name: item.product.name,
        price: item.product.discountedPrice || item.product.price,
        image: primaryImage,
        shop: "",
        category: item.product.category?.name || "",
        addedAt: item.createdAt.toISOString(),
      };
    });

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 },
    );
  }
}

// POST /api/wishlist - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 },
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if item is already in wishlist
    const existingItem = await prisma.wishlistItem.findFirst({
      where: {
        userId: session.user.id,
        productId: productId,
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: "Item already in wishlist" },
        { status: 409 },
      );
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: session.user.id,
        productId: productId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discountedPrice: true,
            images: {
              select: {
                url: true,
                isPrimary: true,
              },
              orderBy: { sortOrder: "asc" },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform the data to match the expected format
    const primaryImage =
      wishlistItem.product.images.find((img: any) => img.isPrimary)?.url ||
      wishlistItem.product.images[0]?.url ||
      "";
    const formattedItem = {
      id: wishlistItem.product.id,
      name: wishlistItem.product.name,
      price: wishlistItem.product.discountedPrice || wishlistItem.product.price,
      image: primaryImage,
      shop: "",
      category: wishlistItem.product.category?.name || "",
      addedAt: wishlistItem.createdAt.toISOString(),
    };

    return NextResponse.json(formattedItem, { status: 201 });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Failed to add to wishlist" },
      { status: 500 },
    );
  }
}
