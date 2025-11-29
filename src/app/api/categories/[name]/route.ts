import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = params.name;

    // Query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "popularity"; // popularity, price-low, price-high, rating, newest, distance
    const search = searchParams.get("search") || "";
    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const rating = searchParams.get("rating")
      ? parseFloat(searchParams.get("rating")!)
      : undefined;
    const storeId = searchParams.get("storeId") || undefined;

    // Get category by slug
    const category = await prisma.productCategory.findFirst({
      where: {
        slug: categorySlug,
        isActive: true,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          message: "Category not found",
        },
        { status: 404 }
      );
    }

    // Get available stores
    const storeWhere: any = { isActive: true, isVerified: true };
    if (storeId) {
      storeWhere.id = storeId;
    }

    const availableStores = await prisma.store.findMany({
      where: storeWhere,
      select: { id: true, latitude: true, longitude: true },
    });

    if (availableStores.length === 0) {
      return NextResponse.json({
        success: true,
        category: {
          id: category.slug,
          name: category.name,
          description: category.description,
          icon: getCategoryIcon(category.slug),
          color: getCategoryColor(category.slug),
          image: category.image || getCategoryImage(category.slug),
          productCount: 0,
        },
        products: [],
        pagination: { page: 1, limit, total: 0, totalPages: 0 },
        filters: {
          sortBy,
          search,
          minPrice,
          maxPrice,
          rating,
          storeId,
        },
      });
    }

    const storeIds = availableStores.map((store) => store.id);

    // Build product where clause
    const productWhere: any = {
      storeInventory: {
        some: {
          storeId: { in: storeIds },
          stockQuantity: { gt: 0 },
          isAvailable: true,
        },
      },
      isAvailable: true,
      categoryName: {
        equals: category.name,
        mode: "insensitive",
      },
    };

    // Add search filter
    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    // Add price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      productWhere.price = {};
      if (minPrice !== undefined) productWhere.price.gte = minPrice;
      if (maxPrice !== undefined) productWhere.price.lte = maxPrice;
    }

    // Add rating filter
    if (rating !== undefined) {
      productWhere.averageRating = { gte: rating };
    }

    // Build orderBy
    const orderBy: any = {};
    switch (sortBy) {
      case "price-low":
        orderBy.price = "asc";
        break;
      case "price-high":
        orderBy.price = "desc";
        break;
      case "rating":
        orderBy.averageRating = "desc";
        break;
      case "newest":
        orderBy.createdAt = "desc";
        break;
      case "popularity":
      default:
        orderBy.totalSales = "desc";
        break;
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: productWhere,
        include: {
          storeInventory: {
            where: {
              storeId: { in: storeIds },
              stockQuantity: { gt: 0 },
              isAvailable: true,
            },
            include: {
              store: {
                select: {
                  id: true,
                  name: true,
                  latitude: true,
                  longitude: true,
                  averageRating: true,
                  totalOrders: true,
                },
              },
            },
            take: 1, // Get the first available store inventory
          },
          images: {
            select: { url: true, alt: true, isPrimary: true },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where: productWhere }),
    ]);

    // Transform products data
    const transformedProducts = products.map((product) => {
      const inventory = product.storeInventory[0];
      const primaryImage =
        product.images.find((img) => img.isPrimary) || product.images[0];

      // Calculate discount percentage
      let discount = 0;
      const currentPrice =
        inventory?.discountedPrice || product.discountedPrice || product.price;
      if (currentPrice < product.price) {
        discount = Math.round(
          ((product.price - currentPrice) / product.price) * 100
        );
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: currentPrice,
        originalPrice: discount > 0 ? product.price : undefined,
        discount: discount > 0 ? discount : undefined,
        rating: product.averageRating || 0,
        reviews: product._count.reviews || 0,
        image: primaryImage?.url || null,
        shop: inventory?.store?.name || "Unknown Shop",
        shopId: inventory?.store?.id || null,
        distance: "2.5 km", // This could be calculated based on user location
        stock: inventory?.stockQuantity || product.stockQuantity || 0,
        deliveryTime: "30 mins", // This could be store-specific
        brand: product.brand,
        isNew: product.isNew,
        isOnSale: product.isOnSale,
        tags: product.tags,
      };
    });

    // Get available filter options
    const filterOptions = await getFilterOptions(category.name, storeIds);

    return NextResponse.json({
      success: true,
      category: {
        id: category.slug,
        name: category.name,
        description: category.description,
        icon: getCategoryIcon(category.slug),
        color: getCategoryColor(category.slug),
        image: category.image || getCategoryImage(category.slug),
        productCount: total,
      },
      products: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        sortBy,
        search,
        minPrice,
        maxPrice,
        rating,
        storeId,
        availableOptions: filterOptions,
      },
    });
  } catch (error: any) {
    console.error("Get category page error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to get filter options
async function getFilterOptions(categoryName: string, storeIds: string[]) {
  const [priceRange, stores, brands] = await Promise.all([
    // Get price range
    prisma.product.aggregate({
      where: {
        categoryName: { equals: categoryName, mode: "insensitive" },
        storeInventory: {
          some: {
            storeId: { in: storeIds },
            stockQuantity: { gt: 0 },
            isAvailable: true,
          },
        },
        isAvailable: true,
      },
      _min: { price: true },
      _max: { price: true },
    }),
    // Get available stores
    prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true },
    }),
    // Get available brands
    prisma.product.findMany({
      where: {
        categoryName: { equals: categoryName, mode: "insensitive" },
        storeInventory: {
          some: {
            storeId: { in: storeIds },
            stockQuantity: { gt: 0 },
            isAvailable: true,
          },
        },
        isAvailable: true,
        brand: { not: null },
      },
      select: { brand: true },
      distinct: ["brand"],
    }),
  ]);

  return {
    priceRange: {
      min: priceRange._min.price || 0,
      max: priceRange._max.price || 1000,
    },
    stores: stores.map((store) => ({ id: store.id, name: store.name })),
    brands: brands.map((product) => product.brand).filter(Boolean),
  };
}

// Helper functions for category data
function getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    grocery: "🛒",
    food: "🍽️",
    medicine: "💊",
    fashion: "👕",
    electronics: "📱",
    household: "🏠",
  };
  return icons[slug] || "🛒";
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
