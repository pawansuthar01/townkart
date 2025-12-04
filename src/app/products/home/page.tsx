"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Star,
  ShoppingCart,
  Heart,
  Eye,
  Package,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import {
  ImageWithFallback,
  getDefaultImage,
} from "@/components/shared/ImageWithFallback";

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
    distance?: string;
    deliveryTime?: string;
    isVerified?: boolean;
  };
}

export default function ProductHomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);

  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        return data.categories || [];
      }
      throw new Error(data.message || "Failed to fetch categories");
    },
  });

  const categories = categoriesData || [];

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products", searchQuery, selectedCategory, sortBy, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "24",
        sortBy,
      });

      if (searchQuery) params.set("query", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);

      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();

      if (data.success) {
        return {
          products: data.data,
          totalPages: data.pagination?.totalPages || 1,
        };
      }
      throw new Error(data.message || "Failed to fetch products");
    },
  });

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const loading = productsLoading || categoriesLoading;
  const error = productsError?.message || categoriesError?.message;

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      image: product.primaryImage || product.images?.[0] || "",
      quantity: 1,
      shop: product.store?.name || "Unknown Shop",
      stock: product.stockQuantity,
    });
  };

  const handleToggleWishlist = (product: Product) => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      image: product.primaryImage || product.images?.[0] || "",
      shop: product.store?.name || "Unknown Shop",
      category: product.categoryName,
      description: product.description || "",
    });
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

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-townkart-primary mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                Loading amazing products...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-16">
        <div className="container-max">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Discover Amazing Products
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Shop from thousands of products delivered fresh to your doorstep
              with lightning-fast delivery
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative mb-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
              <Input
                type="text"
                placeholder="Search for products, brands, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-6 py-4 text-lg bg-white/95 text-gray-900 border-0 rounded-2xl shadow-2xl backdrop-blur-sm placeholder:text-gray-500 focus:ring-4 focus:ring-white/30"
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">10K+</div>
                <div className="text-white/80">Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-white/80">Stores</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">50K+</div>
                <div className="text-white/80">Orders</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">4.8</div>
                <div className="text-white/80">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Controls */}
      <section className="bg-white border-b border-gray-200 sticky top-[73px] z-40 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Categories */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === ""
                    ? "bg-townkart-primary text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                }`}
              >
                All Products
              </button>
              {categories.slice(0, 8).map((category: any) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === category.name
                      ? "bg-townkart-primary text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                  }`}
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category._count?.products || 0}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Sort & View Controls */}
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-townkart-primary bg-white"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-12">
        {error ? (
          <div className="text-center py-16">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to load products
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Package className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or browse different categories
            </p>
            <Button onClick={() => setSelectedCategory("")} variant="outline">
              Browse All Products
            </Button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedCategory
                    ? `${selectedCategory} Products`
                    : "All Products"}
                </h2>
                <p className="text-gray-600">
                  Showing {products.length} amazing products
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-12">
              {products.map((product: any) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white overflow-hidden hover:-translate-y-2"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <Link href={`/products/${product.slug || product.id}`}>
                        <div className="relative aspect-square overflow-hidden">
                          <ImageWithFallback
                            src={
                              product.primaryImage || product.images?.[0] || ""
                            }
                            fallbackSrc={getDefaultImage("product")}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {product.discountedPrice && (
                              <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg">
                                {Math.round(
                                  ((product.price - product.discountedPrice) /
                                    product.price) *
                                    100
                                )}
                                % OFF
                              </Badge>
                            )}
                            {product.isNew && (
                              <Badge className="bg-green-500 text-white text-xs shadow-lg">
                                New
                              </Badge>
                            )}
                            {product.isFeatured && (
                              <Badge className="bg-purple-500 text-white text-xs shadow-lg">
                                Featured
                              </Badge>
                            )}
                          </div>

                          {/* Rating */}
                          {product.averageRating && (
                            <div className="absolute top-3 right-3">
                              <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="text-xs font-bold text-gray-900">
                                  {product.averageRating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="p-2 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleToggleWishlist(product);
                              }}
                            >
                              <Heart
                                className={`h-3 w-3 ${
                                  isInWishlist(product.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-600"
                                }`}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="p-2 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
                            >
                              <Eye className="h-3 w-3 text-gray-600" />
                            </Button>
                          </div>
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="p-4">
                        <Link href={`/products/${product.slug || product.id}`}>
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-townkart-primary transition-colors text-sm leading-tight">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Store & Location Info */}
                        <div className="flex items-center text-xs text-gray-600 mb-3 gap-2">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {product.store?.name || "Unknown Store"}
                          </span>
                          <span className="text-gray-400">•</span>
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span>{getDeliveryTime(product.categoryName)}</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{product.discountedPrice || product.price}
                            </span>
                            {product.discountedPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{product.price}
                              </span>
                            )}
                          </div>
                          {product.totalSales && product.totalSales > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {product.totalSales} sold
                            </Badge>
                          )}
                        </div>

                        {/* Add to Cart */}
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full townkart-gradient hover:opacity-90 font-medium text-sm py-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2"
                >
                  Previous
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page =
                    Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      onClick={() => setCurrentPage(page)}
                      className="px-4 py-2 min-w-[44px]"
                    >
                      {page}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
