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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get products through store inventory
    const where: any = {
      storeId: storeStaff.storeId,
    };

    // Join with products to filter
    if (category && category !== "ALL") {
      where.product = {
        ...where.product,
        categoryName: category,
      };
    }

    if (status && status !== "ALL") {
      where.product = {
        ...where.product,
        stockStatus: status,
      };
    }

    if (search) {
      where.product = {
        ...where.product,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const storeInventory = await prisma.storeInventory.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: {
        product: {
          createdAt: "desc",
        },
      },
      take: limit,
    });

    // Transform products for frontend
    const products = storeInventory.map((inventory) => ({
      id: inventory.product.id,
      name: inventory.product.name,
      sku: inventory.product.sku,
      category: inventory.product.categoryName,
      price: inventory.price || inventory.product.price,
      stock: inventory.stockQuantity,
      status: inventory.product.stockStatus,
      createdAt: inventory.product.createdAt.toISOString(),
      totalSold: inventory.product.totalSales,
      description: inventory.product.description,
    }));

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Store products error:", error);
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

    const body = await request.json();
    const { name, description, price, stockQuantity, categoryName } = body;

    if (!name || !price || !categoryName) {
      return NextResponse.json(
        { error: "Name, price, and category are required" },
        { status: 400 },
      );
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity) || 0,
        categoryName,
        isAvailable: true,
      },
    });

    // Add to store inventory
    await prisma.storeInventory.create({
      data: {
        storeId: storeStaff.storeId,
        productId: product.id,
        stockQuantity: parseInt(stockQuantity) || 0,
        price: parseFloat(price),
        isAvailable: true,
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
