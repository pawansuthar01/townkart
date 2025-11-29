"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  MapPin,
  Clock,
  Truck,
  Heart,
  Eye,
  Loader2,
  X,
  Check,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { useDebounceCallback } from "@/hooks/useDebounce";

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

interface CategoryCount {
  id: string;
  name: string;
  count: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  shop: string;
  stock: number;
}

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);
  const [isOnSaleOnly, setIsOnSaleOnly] = useState(false);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);

  const { addItem } = useCart();
  const {
    products,
    categories,
    isLoading,
    error,
    pagination,
    getProducts,
    getCategories,
  } = useProducts();

  // Debounced search
  const debouncedSetSearchQuery = useDebounceCallback((query: string) => {
    setSearchQuery(query);
  }, 500);

  // Fetch products using hook
  const fetchProducts = async (page = 1) => {
    await getProducts({
      page,
      limit: pagination.limit,
      sortBy,
      query: searchQuery,
      category:
        selectedCategory && selectedCategory !== "all"
          ? selectedCategory
          : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
      inStock: inStockOnly,
      isFeatured: isFeaturedOnly,
      isOnSale: isOnSaleOnly,
      brands: selectedBrands.length > 0 ? selectedBrands : undefined,
    });
  };

  // Fetch categories using hook
  const fetchCategories = async () => {
    await getCategories();
  };

  useEffect(() => {
    fetchProducts();
  }, [
    searchQuery,
    selectedCategory,
    sortBy,
    priceRange,
    selectedBrands,
    inStockOnly,
    isFeaturedOnly,
    isOnSaleOnly,
  ]);

  useEffect(() => {
    if (products.length > 0) {
      fetchCategories();
      // Extract unique brands from products
      const brands = Array.from(
        new Set(products.map((p) => p.brand).filter(Boolean))
      ) as string[];
      setAvailableBrands(brands);
    }
  }, [products, getCategories]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      image: product.primaryImage || product.images?.[0] || "",
      quantity: 1,
      shop: product.store?.name || "Unknown Store",
      stock: product.stockQuantity,
    });
  };

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setPriceRange([0, 10000]);
    setSelectedBrands([]);
    setInStockOnly(false);
    setIsFeaturedOnly(false);
    setIsOnSaleOnly(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-townkart-primary" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error loading products
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const calculateDistance = (lat: number, lng: number) => {
    // Mock distance calculation - in real app, use user's location
    return `${(Math.random() * 5 + 0.5).toFixed(1)} km`;
  };

  const getDeliveryTime = (category: string) => {
    const times: { [key: string]: string } = {
      Grocery: "30 mins",
      Food: "45 mins",
      Medicine: "20 mins",
      Electronics: "1-2 hours",
      Fashion: "1 hour",
      Household: "50 mins",
    };
    return times[category] || "45 mins";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white py-12">
        <div className="w-full px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              All Products
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Discover amazing products from trusted local shops with fast
              delivery
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for products, shops, or categories..."
                value={searchQuery}
                onChange={(e) => debouncedSetSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white text-gray-900 border-0 rounded-full shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="py-6 px-4 bg-white border-b sticky top-[73px] z-40">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? "bg-townkart-primary text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.count}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Price Range */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-gray-600">Price:</span>
                <Input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0] || ""}
                  onChange={(e) =>
                    setPriceRange([
                      parseInt(e.target.value) || 0,
                      priceRange[1],
                    ])
                  }
                  className="w-20 h-8 text-xs"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1] || ""}
                  onChange={(e) =>
                    setPriceRange([
                      priceRange[0],
                      parseInt(e.target.value) || 10000,
                    ])
                  }
                  className="w-20 h-8 text-xs"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-townkart-primary"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="distance">Nearest First</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-townkart-primary text-white" : "text-gray-500"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-townkart-primary text-white" : "text-gray-500"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters Sidebar */}
          {showFilters && (
            <div className="mt-4 p-6 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min Price"
                      value={priceRange[0] || ""}
                      onChange={(e) =>
                        setPriceRange([
                          parseInt(e.target.value) || 0,
                          priceRange[1],
                        ])
                      }
                      className="w-full"
                    />
                    <Input
                      type="number"
                      placeholder="Max Price"
                      value={priceRange[1] || ""}
                      onChange={(e) =>
                        setPriceRange([
                          priceRange[0],
                          parseInt(e.target.value) || 10000,
                        ])
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Brands */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Brands
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableBrands.map((brand) => (
                      <label key={brand} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandToggle(brand)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Availability
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(!inStockOnly)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">
                        In Stock Only
                      </span>
                    </label>
                  </div>
                </div>

                {/* Special Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Special Offers
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isFeaturedOnly}
                        onChange={(e) => setIsFeaturedOnly(!isFeaturedOnly)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">
                        Featured Products
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isOnSaleOnly}
                        onChange={(e) => setIsOnSaleOnly(!isOnSaleOnly)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">On Sale</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 px-4">
        <div className="w-full">
          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {products.length} of {pagination.total} products
            </p>
          </div>

          {/* Products Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {products.map((product: Product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <div
                        className="h-48 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${product.primaryImage || product.images?.[0] || "/placeholder-product.jpg"})`,
                        }}
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.discountedPrice && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs">
                            {Math.round(
                              ((product.price - product.discountedPrice) /
                                product.price) *
                                100
                            )}
                            % OFF
                          </Badge>
                        )}
                        {product.isNew && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            New
                          </Badge>
                        )}
                        {product.isFeatured && (
                          <Badge className="bg-purple-500 text-white text-xs">
                            Featured
                          </Badge>
                        )}
                        <Badge
                          className={`text-xs ${
                            product.isAvailable ? "bg-green-500" : "bg-gray-500"
                          } text-white`}
                        >
                          {product.isAvailable ? "Available" : "Out of Stock"}
                        </Badge>
                      </div>

                      {/* Rating */}
                      {product.averageRating && (
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-xs font-semibold">
                              {product.averageRating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="p-2">
                            <Heart className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="secondary" className="p-2">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-townkart-primary transition-colors">
                          {product.name}
                        </h3>

                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>
                            {product.store
                              ? calculateDistance(
                                  product.store.latitude,
                                  product.store.longitude
                                )
                              : "N/A"}
                          </span>
                          <span className="mx-2">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{getDeliveryTime(product.categoryName)}</span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{product.discountedPrice || product.price}
                            </span>
                            {product.discountedPrice &&
                              product.discountedPrice < product.price && (
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{product.price}
                                </span>
                              )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span className="font-medium">
                            {product.store?.name || "Unknown Store"}
                          </span>
                          <span>{product.totalReviews || 0} reviews</span>
                        </div>

                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full townkart-gradient hover:opacity-90 font-medium"
                          disabled={!product.isAvailable}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {product.isAvailable ? "Add to Cart" : "Out of Stock"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product: Product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="relative w-full md:w-48 h-32 flex-shrink-0">
                        <div
                          className="w-full h-full bg-cover bg-center rounded-lg"
                          style={{
                            backgroundImage: `url(${product.primaryImage || product.images?.[0] || "/placeholder-product.jpg"})`,
                          }}
                        />
                        {product.discountedPrice &&
                          product.discountedPrice < product.price && (
                            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                              {Math.round(
                                ((product.price - product.discountedPrice) /
                                  product.price) *
                                  100
                              )}
                              % OFF
                            </Badge>
                          )}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-townkart-primary transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {product.shortDescription || product.description}
                            </p>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>
                                {product.store
                                  ? calculateDistance(
                                      product.store.latitude,
                                      product.store.longitude
                                    )
                                  : "N/A"}{" "}
                                • {product.store?.name || "Unknown Store"}
                              </span>
                              <span className="mx-2">•</span>
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                {getDeliveryTime(product.categoryName)}
                              </span>
                            </div>
                            {product.averageRating && (
                              <div className="flex items-center mb-3">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="font-semibold mr-2">
                                  {product.averageRating.toFixed(1)}
                                </span>
                                <span className="text-gray-600">
                                  ({product.totalReviews || 0} reviews)
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="text-left md:text-right mt-4 md:mt-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-2xl font-bold text-gray-900">
                                ₹{product.discountedPrice || product.price}
                              </span>
                              {product.discountedPrice &&
                                product.discountedPrice < product.price && (
                                  <span className="text-lg text-gray-500 line-through">
                                    ₹{product.price}
                                  </span>
                                )}
                            </div>
                            <Badge
                              className={`mb-3 ${
                                product.isAvailable
                                  ? "bg-green-500"
                                  : "bg-gray-500"
                              } text-white`}
                            >
                              {product.isAvailable
                                ? "Available"
                                : "Out of Stock"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="townkart-gradient hover:opacity-90 font-medium flex-1"
                            disabled={!product.isAvailable}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {product.isAvailable
                              ? "Add to Cart"
                              : "Out of Stock"}
                          </Button>
                          <Button variant="outline" className="px-4">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {products.length > 0 && pagination.page < pagination.totalPages && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                className="px-8"
                onClick={() => fetchProducts(pagination.page + 1)}
              >
                Load More Products
              </Button>
            </div>
          )}

          {/* Empty State */}
          {products.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or browse different
                categories
              </p>
              <Button onClick={clearAllFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
