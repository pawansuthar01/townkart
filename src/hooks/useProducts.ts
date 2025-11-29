import { useState, useEffect, useCallback } from "react";
import { API_CONFIG } from "@/config/api.config";
import { useGeolocation } from "./useGeolocation";

interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  discountedPrice?: number;
  stockQuantity: number;
  categoryName: string;
  subcategory?: string;
  brand?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  averageRating?: number;
  totalReviews?: number;
  totalSales?: number;
  primaryImage?: string;
  images?: string[];
  store?: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    averageRating?: number;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  merchantId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  isFeatured?: boolean;
  isOnSale?: boolean;
  brands?: string[];
  sortBy?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Geolocation for location-based product filtering
  const {
    latitude,
    longitude,
    accuracy,
    isLoading: isLocationLoading,
    error: locationError,
    getCurrentPosition,
    isSupported: isGeolocationSupported,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
  });

  // Fetch products with filters
  const getProducts = useCallback(
    async (filters: ProductFilters = {}) => {
      try {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams();

        if (filters.page) params.set("page", filters.page.toString());
        if (filters.limit) params.set("limit", filters.limit.toString());
        if (filters.sortBy) params.set("sortBy", filters.sortBy);
        if (filters.query) params.set("query", filters.query);
        if (filters.category) params.set("category", filters.category);
        if (filters.subcategory) params.set("subcategory", filters.subcategory);
        if (filters.merchantId) params.set("merchantId", filters.merchantId);
        if (filters.minPrice !== undefined)
          params.set("minPrice", filters.minPrice.toString());
        if (filters.maxPrice !== undefined)
          params.set("maxPrice", filters.maxPrice.toString());
        if (filters.inStock) params.set("inStock", "true");
        if (filters.isFeatured) params.set("isFeatured", "true");
        if (filters.isOnSale) params.set("isOnSale", "true");
        if (filters.brands && filters.brands.length > 0) {
          filters.brands.forEach((brand) => params.append("brand", brand));
        }

        // Include location parameters for location-based filtering
        if (filters.latitude !== undefined) {
          params.set("latitude", filters.latitude.toString());
        }
        if (filters.longitude !== undefined) {
          params.set("longitude", filters.longitude.toString());
        }

        // If no location provided in filters but we have geolocation, use it
        if (
          filters.latitude === undefined &&
          filters.longitude === undefined &&
          latitude &&
          longitude
        ) {
          params.set("latitude", latitude.toString());
          params.set("longitude", longitude.toString());
          console.log(
            "useProducts: Using user's current location for filtering:",
            latitude,
            longitude
          );
        }

        const response = await fetch(
          `${API_CONFIG.ENDPOINTS.PRODUCTS}?${params}`
        );
        const data = await response.json();

        if (data.success) {
          setProducts(data.data);
          setPagination(data.pagination);
          return data;
        } else {
          setError(data.message || "Failed to fetch products");
          return null;
        }
      } catch (err: any) {
        console.error("useProducts: getProducts error:", err);
        setError(err.message || "Failed to fetch products");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [latitude, longitude]
  );

  // Fetch categories
  const getCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(API_CONFIG.ENDPOINTS.CATEGORIES);
      const data = await response.json();

      if (data.success) {
        setCategories(data.data);
        return data.data;
      } else {
        setError(data.message || "Failed to fetch categories");
        return [];
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch categories");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get trending products for home page
  const getTrendingProducts = useCallback(async (limit: number = 40) => {
    console.log(
      "useProducts: getTrendingProducts called, using /api/products/home"
    );
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      params.set("page", "1");

      const response = await fetch(`/api/products/home?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
        return data;
      } else {
        setError(data.message || "Failed to fetch trending products");
        return null;
      }
    } catch (err: any) {
      console.error("useProducts: getTrendingProducts error:", err);
      setError(err.message || "Failed to fetch trending products");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get featured products
  const getFeaturedProducts = useCallback(
    async (limit: number = 12) => {
      return getProducts({
        isFeatured: true,
        limit,
        page: 1,
      });
    },
    [getProducts]
  );

  // Get products on sale
  const getSaleProducts = useCallback(
    async (limit: number = 12) => {
      return getProducts({
        isOnSale: true,
        limit,
        page: 1,
      });
    },
    [getProducts]
  );

  // Search products
  const searchProducts = useCallback(
    async (query: string, filters: Omit<ProductFilters, "query"> = {}) => {
      return getProducts({
        ...filters,
        query,
      });
    },
    [getProducts]
  );

  return {
    // State
    products,
    categories,
    isLoading,
    error,
    pagination,

    // Geolocation state
    userLocation: {
      latitude,
      longitude,
      accuracy,
    },
    isLocationLoading,
    locationError,
    isGeolocationSupported,

    // Actions
    getProducts,
    getCategories,
    getTrendingProducts,
    getFeaturedProducts,
    getSaleProducts,
    searchProducts,
    getCurrentPosition,

    // Utilities
    hasProducts: products.length > 0,
    hasCategories: categories.length > 0,
    totalProducts: pagination?.total || 0,
    currentPage: pagination?.page || 1,
    totalPages: pagination?.totalPages || 0,
    hasUserLocation: latitude !== null && longitude !== null,
  };
};
