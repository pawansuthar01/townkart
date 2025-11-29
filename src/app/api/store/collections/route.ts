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

    // Get store manager's store
    const storeStaff = await prisma.storeStaff.findFirst({
      where: { userId: session.user.id },
    });

    if (!storeStaff) {
      return NextResponse.json(
        { error: "Store access not found" },
        { status: 404 },
      );
    }

    const collections = await prisma.storeCollection.findMany({
      where: { storeId: storeStaff.storeId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error("Store collections error:", error);
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

    // Get store manager's store
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
    const {
      name,
      description,
      products,
      type,
      filters,
      image,
      bannerImage,
      isActive,
      isFeatured,
      sortOrder,
      metaTitle,
      metaDescription,
    } = body;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists for this store
    const existingCollection = await prisma.storeCollection.findFirst({
      where: {
        storeId: storeStaff.storeId,
        slug,
      },
    });

    if (existingCollection) {
      return NextResponse.json(
        { error: "Collection with this name already exists" },
        { status: 400 },
      );
    }

    const collection = await prisma.storeCollection.create({
      data: {
        storeId: storeStaff.storeId,
        name,
        slug,
        description,
        products: products || [],
        type: type || "MANUAL",
        filters,
        image,
        bannerImage,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
        sortOrder: sortOrder || 0,
        metaTitle,
        metaDescription,
      },
    });

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error("Create store collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
