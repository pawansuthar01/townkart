import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const collectionId = params.id;
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

    // Check if collection exists and belongs to the store
    const existingCollection = await prisma.storeCollection.findFirst({
      where: {
        id: collectionId,
        storeId: storeStaff.storeId,
      },
    });

    if (!existingCollection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    // Generate new slug if name changed
    let slug = existingCollection.slug;
    if (name && name !== existingCollection.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check if new slug conflicts with another collection
      const conflictingCollection = await prisma.storeCollection.findFirst({
        where: {
          storeId: storeStaff.storeId,
          slug,
          id: { not: collectionId },
        },
      });

      if (conflictingCollection) {
        return NextResponse.json(
          { error: "Collection with this name already exists" },
          { status: 400 },
        );
      }
    }

    const updatedCollection = await prisma.storeCollection.update({
      where: { id: collectionId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(products && { products }),
        ...(type && { type }),
        ...(filters !== undefined && { filters }),
        ...(image !== undefined && { image }),
        ...(bannerImage !== undefined && { bannerImage }),
        ...(isActive !== undefined && { isActive }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(name && { slug }),
      },
    });

    return NextResponse.json({
      success: true,
      collection: updatedCollection,
    });
  } catch (error) {
    console.error("Update store collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

    const collectionId = params.id;

    // Check if collection exists and belongs to the store
    const existingCollection = await prisma.storeCollection.findFirst({
      where: {
        id: collectionId,
        storeId: storeStaff.storeId,
      },
    });

    if (!existingCollection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 },
      );
    }

    await prisma.storeCollection.delete({
      where: { id: collectionId },
    });

    return NextResponse.json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    console.error("Delete store collection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
