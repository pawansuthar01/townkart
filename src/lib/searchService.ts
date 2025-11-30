import { prisma } from "@/lib/prisma";

export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  sortBy?: "relevance" | "price-low" | "price-high" | "newest";
}

export interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  image: string | null;
  shop: string;
  shopId: string;
  distance: string;
  stock: number;
  deliveryTime: string;
  brand?: string;
  isNew?: boolean;
  isOnSale?: boolean;
  tags?: string[];
  score: number;
}

export interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  intent: "search" | "filter" | "navigate" | "unknown";
  entities: {
    products?: string[];
    categories?: string[];
    brands?: string[];
    priceRange?: { min: number; max: number };
    location?: string;
  };
}

export class SearchService {
  static async basicSearch(
    filters: SearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ results: SearchResult[]; total: number }> {
    try {
      const {
        query,
        category,
        minPrice,
        maxPrice,
        brand,
        sortBy = "relevance",
      } = filters;

      const where: any = {
        isAvailable: true,
        stockQuantity: { gt: 0 },
      };

      if (query) {
        where.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { categoryName: { contains: query, mode: "insensitive" } },
        ];
      }

      if (category) {
        where.categoryName = { contains: category, mode: "insensitive" };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }

      if (brand) {
        where.brand = { contains: brand, mode: "insensitive" };
      }

      const products = await prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy:
          sortBy === "price-low"
            ? { price: "asc" }
            : sortBy === "price-high"
              ? { price: "desc" }
              : sortBy === "newest"
                ? { createdAt: "desc" }
                : { createdAt: "desc" },
      });

      const productIds = products.map((p) => p.id);
      const inventories = await prisma.storeInventory.findMany({
        where: { productId: { in: productIds }, stockQuantity: { gt: 0 } },
        include: { store: true },
      });

      const results = products
        .map((product) => {
          const inventory = inventories.find(
            (inv) => inv.productId === product.id
          );
          if (!inventory) return null;

          return {
            id: product.id,
            name: product.name,
            description: product.description || "",
            price: product.price,
            originalPrice: product.discountedPrice || undefined,
            discount: product.discountedPrice
              ? Math.round(
                  ((product.price - product.discountedPrice) / product.price) *
                    100
                )
              : undefined,
            rating: 4.0,
            reviews: 0,
            image:
              Array.isArray(product.imageUrls) && product.imageUrls.length > 0
                ? (product.imageUrls[0] as string)
                : null,
            shop: inventory.store.name,
            shopId: inventory.store.id,
            distance: "N/A",
            stock: inventory.stockQuantity,
            deliveryTime: "30 mins",
            brand: product.brand || undefined,
            isNew: product.isNew || false,
            isOnSale: product.isOnSale || false,
            tags: [],
            score: 1.0,
          };
        })
        .filter(Boolean) as SearchResult[];

      const total = await prisma.product.count({ where });
      return { results, total };
    } catch (error) {
      console.error("Search error:", error);
      return { results: [], total: 0 };
    }
  }

  static async processVoiceSearch(audioBlob: Blob): Promise<VoiceSearchResult> {
    return {
      transcript: "Voice search not implemented",
      confidence: 0,
      intent: "unknown",
      entities: {},
    };
  }

  static async searchByImage(imageFile: File): Promise<SearchResult[]> {
    return [];
  }

  static async getRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    return this.basicSearch({}, limit, 0).then((result) => result.results);
  }

  static async getTrendingProducts(
    limit: number = 10
  ): Promise<SearchResult[]> {
    return this.basicSearch({}, limit, 0).then((result) => result.results);
  }
}
