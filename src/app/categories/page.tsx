"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
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
  UtensilsCrossed,
  Heart,
  Shirt,
  Smartphone,
  Home,
  BookOpen,
  Dumbbell,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import {
  getActiveCategories,
  getCategoriesSorted,
  searchCategories,
  getCategoryStats,
  getCategoryIconName,
  getCategoryColor,
  generateCategoryUrl,
} from "@/lib/categoryService";
import {
  ImageWithFallback,
  getDefaultImage,
} from "@/components/shared/ImageWithFallback";

export default function CategoriesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const { addItem } = useCart();

  // Get categories from service
  const allCategories = getCategoriesSorted();
  const categories =
    searchCategories(searchQuery).length > 0
      ? searchCategories(searchQuery)
      : allCategories;

  // Icon mapping for categories
  const iconMap = {
    ShoppingCart,
    UtensilsCrossed,
    Heart,
    Shirt,
    Smartphone,
    Home,
    BookOpen,
    Dumbbell,
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await fetch("/api/products/home?limit=50");
      const data = await response.json();

      if (data.success && data.data) {
        // Transform products to match expected format
        const transformedProducts = data.data.map((product: any) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.discountedPrice ? product.price : undefined,
          discount: product.discountedPrice
            ? Math.round(
                ((product.price - product.discountedPrice) / product.price) *
                  100
              )
            : undefined,
          rating: product.averageRating || 0,
          reviews: product.totalReviews || 0,
          image: product.primaryImage || product.images?.[0] || undefined,
          shop: product.store?.name || "Unknown Shop",
          distance: "2.5 km",
          stock: product.stockQuantity || 0,
          category: product.categoryName || "",
          deliveryTime: "30 mins",
          isAvailable: (product.stockQuantity || 0) > 0,
        }));
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shop.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "distance":
        return parseFloat(a.distance) - parseFloat(b.distance);
      default:
        return b.reviews - a.reviews; // popularity
    }
  });

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      shop: product.shop,
      stock: product.stock,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white py-12 md:py-16">
        <div className="w-full px-4">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              Shop by Categories
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-6 md:mb-8">
              Discover products from your favorite categories with fast delivery
              and great prices
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:pl-12 pr-4 py-2 md:py-3 bg-white text-gray-900 border-0 rounded-full shadow-lg text-sm md:text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-8 md:py-12 px-4">
        <div className="w-full">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
              Browse Categories
            </h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Choose from our wide range of categories to find exactly what
              you're looking for
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-8 md:mb-12">
            {categories.map((category) => {
              const IconComponent =
                iconMap[
                  getCategoryIconName(category.slug) as keyof typeof iconMap
                ] || ShoppingCart;
              const categoryUrl = generateCategoryUrl(category.slug);

              return (
                <Link key={category.id} href={categoryUrl}>
                  <Card
                    className={`group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-full border-0 ${
                      selectedCategory === category.id
                        ? "ring-2 ring-townkart-primary"
                        : ""
                    }`}
                  >
                    <div className="relative h-24 md:h-32 lg:h-40">
                      <ImageWithFallback
                        src={category.image || undefined}
                        fallbackSrc={getDefaultImage("banner")}
                        alt={category.name}
                        fill
                        className="object-cover"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-t ${getCategoryColor(category.slug)} opacity-90 group-hover:opacity-80 transition-opacity`}
                      />
                      <div className="absolute inset-0 p-2 md:p-4 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                          <div className="p-1.5 md:p-2 rounded-full bg-white/20 backdrop-blur-sm">
                            <IconComponent className="h-3 w-3 md:h-4 md:w-4" />
                          </div>
                          <Badge className="bg-white/20 text-white border-white/30 text-xs">
                            {category.productCount}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="text-xs md:text-sm font-bold mb-0.5 md:mb-1">
                            {category.name}
                          </h3>
                          <p className="text-xs text-white/90 mb-1 md:mb-2 line-clamp-2">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 md:py-12 px-4 bg-white">
        <div className="w-full">
          {/* Filters and Controls */}
          <div className="flex flex-col gap-4 mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                  All Products
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  {filteredProducts.length} products found
                </p>
              </div>

              {/* View Mode - Mobile first */}
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
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-townkart-primary flex-1 sm:flex-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-townkart-primary flex-1 sm:flex-none"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="distance">Nearest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {sortedProducts.map((product) => (
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
                      <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1 md:gap-2">
                        {product.discount && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs">
                            {product.discount}% OFF
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
                      <div className="absolute top-2 right-2 md:top-3 md:right-3">
                        <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-xs font-semibold">
                            {product.rating}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3 md:p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {product.name}
                        </h3>

                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{product.distance}</span>
                          <span className="mx-2">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{product.deliveryTime}</span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{product.price}
                            </span>
                            {product.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                          <span>{product.shop}</span>
                          <span>{product.reviews} reviews</span>
                        </div>

                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full townkart-gradient hover:opacity-90 font-medium"
                          disabled={!product.isAvailable}
                        >
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
              {sortedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-all duration-300 border-0"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="relative w-full md:w-48 h-32 flex-shrink-0">
                        <ImageWithFallback
                          src={product.image || undefined}
                          fallbackSrc={getDefaultImage("product")}
                          alt={product.name}
                          width={192}
                          height={128}
                          className="object-cover w-full h-full rounded-lg"
                        />
                        {product.discount && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                            {product.discount}% OFF
                          </Badge>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {product.name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>
                                {product.distance} • {product.shop}
                              </span>
                              <span className="mx-2">•</span>
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{product.deliveryTime}</span>
                            </div>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-semibold mr-2">
                                {product.rating}
                              </span>
                              <span className="text-gray-600">
                                ({product.reviews} reviews)
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-2xl font-bold text-gray-900">
                                ₹{product.price}
                              </span>
                              {product.originalPrice && (
                                <span className="text-lg text-gray-500 line-through">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>
                            <Badge
                              className={`${
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

                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="townkart-gradient hover:opacity-90 font-medium"
                          disabled={!product.isAvailable}
                        >
                          {product.isAvailable ? "Add to Cart" : "Out of Stock"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {sortedProducts.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="px-8">
                Load More Products
              </Button>
            </div>
          )}

          {/* Empty State */}
          {sortedProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
