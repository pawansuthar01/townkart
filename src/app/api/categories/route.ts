import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
    if (categories.length > 0) {
      // Return real categories from database
      const formattedCategories = categories.map((category: any) => ({
        id: category.slug,
        name: category.name,
        icon: getCategoryIcon(category.slug),
        count: category._count.products || 0,
        image: category.image || getCategoryImage(category.slug),
        color: getCategoryColor(category.slug),
        description:
          category.description || getCategoryDescription(category.slug),
      }));
      console.log(formattedCategories);

      return NextResponse.json({
        success: true,
        categories: formattedCategories,
      });
    }
  } catch (error: any) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions for default category data
function getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    grocery: "ShoppingCart",
    food: "Store",
    medicine: "Shield",
    fashion: "Users",
    electronics: "Smartphone",
    household: "Home",
  };
  return icons[slug] || "ShoppingCart";
}

function getCategoryImage(slug: string): string {
  const images: Record<string, string> = {
    grocery:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop",
    food: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
    medicine:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
    fashion:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
    electronics:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=200&fit=crop",
    household:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop",
  };
  return (
    images[slug] ||
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop"
  );
}

function getCategoryColor(slug: string): string {
  const colors: Record<string, string> = {
    grocery: "from-green-500 to-green-600",
    food: "from-orange-500 to-red-500",
    medicine: "from-blue-500 to-blue-600",
    fashion: "from-purple-500 to-pink-500",
    electronics: "from-gray-700 to-gray-800",
    household: "from-teal-500 to-cyan-500",
  };
  return colors[slug] || "from-gray-500 to-gray-600";
}

function getCategoryDescription(slug: string): string {
  const descriptions: Record<string, string> = {
    grocery: "Fresh produce & daily essentials",
    food: "Restaurants & food delivery",
    medicine: "Pharmacy & healthcare",
    fashion: "Clothing & accessories",
    electronics: "Gadgets & electronics",
    household: "Home & kitchen essentials",
  };
  return descriptions[slug] || "Various products";
}
