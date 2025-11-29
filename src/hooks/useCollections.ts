import { useState, useEffect, useCallback } from "react";
import { API_CONFIG } from "@/config/api.config";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
  // UI-specific properties (computed)
  title?: string;
  subtitle?: string;
  itemCount?: number;
  totalValue?: number;
  avgRating?: number;
  featured?: boolean;
}

interface CollectionFilters {
  isActive?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch collections with filters
  const getCollections = useCallback(
    async (filters: CollectionFilters = {}) => {
      try {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams();

        if (filters.page) params.set("page", filters.page.toString());
        if (filters.limit) params.set("limit", filters.limit.toString());
        if (filters.sortBy) params.set("sortBy", filters.sortBy);
        if (filters.isActive !== undefined)
          params.set("isActive", filters.isActive.toString());

        const response = await fetch(
          `${API_CONFIG.ENDPOINTS.COLLECTIONS}?${params}`,
        );
        const data = await response.json();

        if (data.success) {
          setCollections(data.data);
          setPagination(data.pagination);
          return data;
        } else {
          setError(data.message || "Failed to fetch collections");
          return null;
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch collections");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Get collection by slug
  const getCollectionBySlug = useCallback(async (slug: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_CONFIG.ENDPOINTS.COLLECTIONS}/${slug}`,
      );
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        setError(data.message || "Failed to fetch collection");
        return null;
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch collection");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get featured collections
  const getFeaturedCollections = useCallback(
    async (limit: number = 6) => {
      return getCollections({
        isActive: true,
        sortBy: "sortOrder",
        limit,
        page: 1,
      });
    },
    [getCollections],
  );

  // Get active collections
  const getActiveCollections = useCallback(
    async (limit?: number) => {
      return getCollections({
        isActive: true,
        sortBy: "sortOrder",
        limit,
        page: 1,
      });
    },
    [getCollections],
  );

  return {
    // State
    collections,
    isLoading,
    error,
    pagination,

    // Actions
    getCollections,
    getCollectionBySlug,
    getFeaturedCollections,
    getActiveCollections,

    // Utilities
    hasCollections: collections.length > 0,
    totalCollections: pagination?.total || 0,
    currentPage: pagination?.page || 1,
    totalPages: pagination?.totalPages || 0,
  };
};
