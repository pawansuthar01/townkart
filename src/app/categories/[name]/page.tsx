"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCart } from "@/hooks/useCart";
import {
  ImageWithFallback,
  getDefaultImage,
} from "@/components/shared/ImageWithFallback";
import {
  Search,
  Filter,
  Grid,
  List,
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  ShoppingCart,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Product {
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
  shopId: string | null;
  distance: string;
  stock: number;
  deliveryTime: string;
  brand?: string;
  isNew?: boolean;
  isOnSale?: boolean;
  tags?: string[];
}

interface CategoryData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  image: string;
  productCount: number;
}

interface FilterOptions {
  priceRange: { min: number; max: number };
  stores: Array<{ id: string; name: string }>;
  brands: string[];
}

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const categorySlug = params.name as string;
  const { addItem } = useCart();

  // Generate dynamic delivery time based on distance
  const generateDeliveryTime = (distance: string) => {
    const distanceKm = parseFloat(distance.replace(" km", ""));
    // Base time 15-30 mins, add 5 mins per km
    const baseTime = Math.floor(Math.random() * 15) + 15; // 15-30 mins
    const additionalTime = Math.floor(distanceKm * 5); // 5 mins per km
    const totalTime = baseTime + additionalTime;
    return `${totalTime} mins`;
  };

  // State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [category, setCategory] = useState<CategoryData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    sortBy: searchParams.get("sortBy") || "popularity",
    minPrice: searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined,
    rating: searchParams.get("rating")
      ? parseFloat(searchParams.get("rating")!)
      : undefined,
    storeId: searchParams.get("storeId") || undefined,
    brand: searchParams.get("brand") || undefined,
    page: parseInt(searchParams.get("page") || "1"),
  });
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Debounced search - only update filters after user stops typing for 500ms
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        handleFilterChange({ search: searchInput });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput, filters.search]);

  // Build query string for URL
  const buildQueryString = useCallback((newFilters: typeof filters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
      }
    });
    return params.toString();
  }, []);

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: typeof filters) => {
      const queryString = buildQueryString(newFilters);
      const newUrl = queryString
        ? `/categories/${categorySlug}?${queryString}`
        : `/categories/${categorySlug}`;
      router.replace(newUrl, { scroll: false });
    },
    [categorySlug, buildQueryString, router]
  );

  // Fetch data from combined API
  const fetchData = useCallback(
    async (currentFilters: typeof filters, page: number = 1) => {
      try {
        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "20",
          ...Object.fromEntries(
            Object.entries(currentFilters).filter(
              ([_, value]) =>
                value !== undefined && value !== null && value !== ""
            )
          ),
        });

        const response = await fetch(
          `/api/categories/${categorySlug}?${queryParams}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch data");
        }

        if (data.success) {
          setCategory(data.category);
          setProducts(data.products);
          setPagination(data.pagination);
          setFilterOptions(data.filters.availableOptions);
        } else {
          throw new Error(data.message || "Failed to load data");
        }
      } catch (err: any) {
        console.error("Error fetching category data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    },
    [categorySlug]
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: Partial<typeof filters>) => {
      const updatedFilters = { ...filters, ...newFilters, page: 1 };
      setFilters(updatedFilters);
      updateURL(updatedFilters);
      fetchData(updatedFilters, 1);
    },
    [filters, updateURL, fetchData]
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      const updatedFilters = { ...filters, page: newPage };
      setFilters(updatedFilters);
      updateURL(updatedFilters);
      fetchData(updatedFilters, newPage);
    },
    [filters, updateURL, fetchData]
  );

  // Initial load
  useEffect(() => {
    fetchData(filters, filters.page || 1);
  }, []); // Only run once on mount

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || "",
      quantity: 1,
      shop: product.shop,
      stock: product.stock,
    });
  };

  if (isLoading && !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (error && !category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            icon={<X className="h-12 w-12" />}
            title="Error loading category"
            description={error}
            action={{
              label: "Try Again",
              onClick: () => fetchData(filters, filters.page || 1),
            }}
          />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            icon={<Search className="h-12 w-12" />}
            title="Category not found"
            description="The category you're looking for doesn't exist."
            action={{
              label: "Browse All Categories",
              onClick: () => router.push("/categories"),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-r ${category.color} text-white`}>
        <div className="w-full px-4 md:px-6 py-6 md:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/categories">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Categories
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-3xl md:text-4xl">{category.icon}</div>
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">
                {category.name}
              </h1>
              <p className="text-white/90 text-sm md:text-lg">
                {category.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b shadow-sm">
        <div className="w-full px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col gap-3 md:gap-4">
            {/* Search and Controls */}
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              {/* Search */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Sort */}
              <Select
                value={filters.sortBy}
                onValueChange={(value) => handleFilterChange({ sortBy: value })}
              >
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>

              {/* View Mode */}
              <div className="hidden lg:flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-500 text-white" : "text-gray-500"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-500"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Advanced Filters - Desktop */}
            <div className="hidden lg:flex flex-wrap gap-4 items-center">
              {/* Price Range */}
              {filterOptions && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Price:</span>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        minPrice: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-20 h-8"
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice || ""}
                    onChange={(e) =>
                      handleFilterChange({
                        maxPrice: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-20 h-8"
                  />
                </div>
              )}

              {/* Rating Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rating:</span>
                <Select
                  value={filters.rating?.toString() || ""}
                  onValueChange={(value) =>
                    handleFilterChange({
                      rating: value ? parseFloat(value) : undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="2">2+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Store Filter */}
              {filterOptions && filterOptions.stores.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Store:</span>
                  <Select
                    value={filters.storeId || ""}
                    onValueChange={(value) =>
                      handleFilterChange({ storeId: value || undefined })
                    }
                  >
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue placeholder="All Stores" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Brand Filter */}
              {filterOptions && filterOptions.brands.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Brand:</span>
                  <Select
                    value={filters.brand || ""}
                    onValueChange={(value) =>
                      handleFilterChange({ brand: value || undefined })
                    }
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterOptions.brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clear Filters */}
              {(filters.minPrice ||
                filters.maxPrice ||
                filters.rating ||
                filters.storeId ||
                filters.brand) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleFilterChange({
                      minPrice: undefined,
                      maxPrice: undefined,
                      rating: undefined,
                      storeId: undefined,
                      brand: undefined,
                    })
                  }
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Mobile Filters */}
            {isFiltersOpen && (
              <div className="lg:hidden space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Price Range */}
                {filterOptions && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Price Range
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ""}
                        onChange={(e) =>
                          handleFilterChange({
                            minPrice: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ""}
                        onChange={(e) =>
                          handleFilterChange({
                            maxPrice: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}

                {/* Rating Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Minimum Rating
                  </label>
                  <Select
                    value={filters.rating?.toString() || ""}
                    onValueChange={(value) =>
                      handleFilterChange({
                        rating: value ? parseFloat(value) : undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="2">2+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Store Filter */}
                {filterOptions && filterOptions.stores.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Store
                    </label>
                    <Select
                      value={filters.storeId || ""}
                      onValueChange={(value) =>
                        handleFilterChange({ storeId: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All stores" />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions.stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Brand Filter */}
                {filterOptions && filterOptions.brands.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Brand
                    </label>
                    <Select
                      value={filters.brand || ""}
                      onValueChange={(value) =>
                        handleFilterChange({ brand: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All brands" />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions.brands.map((brand) => (
                          <SelectItem key={brand} value={brand}>
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="p-4 md:p-6">
        <div className="w-full">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {pagination.total}{" "}
              {pagination.total === 1 ? "product" : "products"} found
            </p>
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${viewMode === "grid" ? "bg-blue-500 text-white" : "text-gray-500"}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${viewMode === "list" ? "bg-blue-500 text-white" : "text-gray-500"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner className="h-8 w-8" />
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="No products found"
              description="Try adjusting your search criteria or browse other categories."
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <ImageWithFallback
                        src={product.image || undefined}
                        fallbackSrc={getDefaultImage("product")}
                        alt={product.name}
                        width={300}
                        height={200}
                        className="object-cover w-full h-48"
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 space-y-2">
                        {product.discount && (
                          <Badge className="bg-red-500 text-white font-bold">
                            {product.discount}% OFF
                          </Badge>
                        )}
                        {product.isNew && (
                          <Badge className="bg-green-500 text-white font-bold">
                            NEW
                          </Badge>
                        )}
                        {product.rating >= 4.5 && (
                          <Badge className="bg-yellow-500 text-white font-bold">
                            ★ BEST SELLER
                          </Badge>
                        )}
                        <Badge className="bg-blue-500 text-white font-bold text-xs">
                          FREE DELIVERY
                        </Badge>
                        <Badge className="bg-purple-500 text-white font-bold text-xs">
                          COD AVAILABLE
                        </Badge>
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="p-2">
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 md:p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-base md:text-lg line-clamp-2 flex-1 mr-2">
                          {product.name}
                        </h3>
                      </div>

                      <p className="text-gray-600 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Shop Info */}
                      <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{product.distance}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span className="truncate">
                            {generateDeliveryTime(product.distance)}
                          </span>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center mb-2 md:mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < Math.floor(product.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-2">
                          ({product.reviews})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className="flex items-center space-x-1 md:space-x-2">
                          <span className="text-lg md:text-xl font-bold text-gray-900">
                            ₹{product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-xs md:text-sm text-gray-500 line-through">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs truncate max-w-20 md:max-w-none"
                        >
                          {product.shop}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                            In Stock ({product.stock})
                          </span>
                          <span className="flex items-center">
                            <span className="text-green-600 font-medium">
                              ★ Trusted Seller
                            </span>
                          </span>
                        </div>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full townkart-gradient hover:opacity-90 font-medium text-sm"
                          size="sm"
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-lg transition-all duration-300 border-0 overflow-hidden"
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                      <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 mx-auto sm:mx-0">
                        <ImageWithFallback
                          src={product.image || undefined}
                          fallbackSrc={getDefaultImage("product")}
                          alt={product.name}
                          width={128}
                          height={128}
                          className="object-cover w-full h-full rounded-lg"
                        />
                        {product.discount && (
                          <Badge className="absolute -top-2 -left-2 bg-red-500 text-white text-xs">
                            {product.discount}% OFF
                          </Badge>
                        )}
                      </div>

                      <div className="flex-1 w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-1 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2 md:mb-3">
                              {product.description}
                            </p>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-2 md:mb-3">
                              <div className="flex items-center min-w-0 flex-1">
                                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                                <span className="truncate">
                                  {product.distance} • {product.shop}
                                </span>
                              </div>
                              <div className="flex items-center flex-shrink-0">
                                <Clock className="h-3 w-3 mr-1" />
                                <span className="whitespace-nowrap">
                                  {generateDeliveryTime(product.distance)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3 sm:mb-0">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < Math.floor(product.rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-600">
                                {product.rating.toFixed(1)} ({product.reviews}{" "}
                                reviews)
                              </span>
                            </div>
                          </div>

                          <div className="text-center sm:text-right w-full sm:w-auto sm:ml-6">
                            <div className="flex items-center justify-center sm:justify-end space-x-2 mb-3 md:mb-4">
                              <span className="text-xl md:text-2xl font-bold text-gray-900">
                                ₹{product.price}
                              </span>
                              {product.originalPrice && (
                                <span className="text-sm md:text-lg text-gray-500 line-through">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>

                            <div className="w-full sm:w-auto">
                              <div className="flex items-center justify-center sm:justify-start text-xs text-gray-500 mb-2">
                                <span className="flex items-center mr-4">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                  In Stock ({product.stock})
                                </span>
                                <span className="text-green-600 font-medium">
                                  ★ Trusted Seller
                                </span>
                              </div>
                              <Button
                                onClick={() => handleAddToCart(product)}
                                className="townkart-gradient hover:opacity-90 font-medium w-full"
                              >
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const pageNum =
                      Math.max(
                        1,
                        Math.min(pagination.totalPages - 4, pagination.page - 2)
                      ) + i;
                    if (pageNum > pagination.totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          pageNum === pagination.page ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
