import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const limit = parseInt(searchParams.get("limit") || "10");

    let where: any = {};

    // Filter by type if specified
    if (type !== "all") {
      where.type = type;
    }

    const collections = await prisma.collection.findMany({
      where,
      take: limit,
      orderBy: {
        sortOrder: "asc",
      },
    });

    // Transform collections for frontend
    const transformedCollections = collections.map((collection) => {
      // Debug logging for collection.products
      console.log(
        `Collection ${collection.id} (${collection.name}): products =`,
        collection.products,
        `type: ${typeof collection.products}`,
      );

      let itemCount = 0;
      try {
        if (collection.products) {
          if (typeof collection.products === "string") {
            itemCount = JSON.parse(collection.products).length;
          } else if (Array.isArray(collection.products)) {
            itemCount = collection.products.length;
          } else {
            console.warn(
              `Unexpected products type for collection ${collection.id}:`,
              typeof collection.products,
            );
          }
        }
      } catch (error) {
        console.error(
          `Error processing products for collection ${collection.id}:`,
          error,
        );
      }

      return {
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        image: collection.image,
        bannerImage: collection.bannerImage,
        type: collection.type,
        itemCount,
        isActive: collection.isActive,
        isFeatured: collection.isFeatured,
        link: `/collections/${collection.slug}`,
        title: collection.name,
        subtitle: collection.description || "",
      };
    });

    return NextResponse.json({
      success: true,
      collections: transformedCollections,
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch collections" },
      { status: 500 },
    );
  }
}
