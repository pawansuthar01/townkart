import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get store staff's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
      );
    }

    const productId = params.productId;
    const body = await request.json();
    const { name, description, price, stockQuantity, categoryName } = body;

    if (!name || !price || !categoryName) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 },
      );
    }

    // Check if product exists in store inventory
    const storeInventory = await prisma.storeInventory.findFirst({
      where: {
        storeId: storeStaff.storeId,
        productId,
      },
      include: {
        product: true,
      },
    });

    if (!storeInventory) {
      return NextResponse.json(
        { error: "Product not found in store inventory" },
        { status: 404 },
      );
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity) || 0,
        categoryName,
      },
    });

    // Update store inventory
    await prisma.storeInventory.update({
      where: { id: storeInventory.id },
      data: {
        stockQuantity: parseInt(stockQuantity) || 0,
        price: parseFloat(price),
      },
    });

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { productId: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get store staff's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
      );
    }

    const productId = params.productId;

    // Check if product exists in store inventory
    const storeInventory = await prisma.storeInventory.findFirst({
      where: {
        storeId: storeStaff.storeId,
        productId,
      },
    });

    if (!storeInventory) {
      return NextResponse.json(
        { error: "Product not found in store inventory" },
        { status: 404 },
      );
    }

    // Remove from store inventory (don't delete the product itself, just from this store)
    await prisma.storeInventory.delete({
      where: { id: storeInventory.id },
    });

    return NextResponse.json({
      success: true,
      message: "Product removed from store inventory",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
