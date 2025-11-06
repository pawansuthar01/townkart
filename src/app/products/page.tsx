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
  Heart,
  Eye,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function ProductsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCart();

  const categories = [
    { id: "all", name: "All Products", count: 156 },
    { id: "grocery", name: "Grocery", count: 45 },
    { id: "food", name: "Food", count: 32 },
    { id: "medicine", name: "Medicine", count: 18 },
    { id: "fashion", name: "Fashion", count: 28 },
    { id: "electronics", name: "Electronics", count: 22 },
    { id: "household", name: "Household", count: 11 },
  ];

  const products = [
    {
      id: 1,
      name: "Fresh Organic Tomatoes",
      price: 40,
      originalPrice: 50,
      discount: 20,
      rating: 4.5,
      reviews: 128,
      image:
        "https://images.unsplash.com/photo-1546470427-e9e826abd807?w=300&h=200&fit=crop",
      shop: "Fresh Mart",
      distance: "0.8 km",
      stock: 25,
      category: "grocery",
      deliveryTime: "30 mins",
      isAvailable: true,
      description:
        "Fresh, organic tomatoes grown without pesticides. Perfect for salads and cooking.",
    },
    {
      id: 2,
      name: "Grilled Chicken Salad",
      price: 180,
      rating: 4.8,
      reviews: 95,
      image:
        "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop",
      shop: "Healthy Bites Cafe",
      distance: "1.2 km",
      stock: 15,
      category: "food",
      deliveryTime: "45 mins",
      isAvailable: true,
      description:
        "Grilled chicken breast with mixed greens, cherry tomatoes, cucumber, and house dressing.",
    },
    {
      id: 3,
      name: "Wireless Headphones",
      price: 2499,
      originalPrice: 2999,
      discount: 17,
      rating: 4.6,
      reviews: 203,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
      shop: "TechHub Electronics",
      distance: "2.1 km",
      stock: 8,
      category: "electronics",
      deliveryTime: "1-2 hours",
      isAvailable: true,
      description:
        "Premium wireless headphones with noise cancellation and 30-hour battery life.",
    },
    {
      id: 4,
      name: "Paracetamol Tablets",
      price: 25,
      rating: 4.9,
      reviews: 67,
      image:
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop",
      shop: "City Pharmacy",
      distance: "0.5 km",
      stock: 50,
      category: "medicine",
      deliveryTime: "20 mins",
      isAvailable: true,
      description:
        "500mg paracetamol tablets for pain relief and fever reduction.",
    },
    {
      id: 5,
      name: "Premium Coffee Beans",
      price: 450,
      rating: 4.7,
      reviews: 156,
      image:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&h=200&fit=crop",
      shop: "Brew Masters",
      distance: "1.5 km",
      stock: 20,
      category: "grocery",
      deliveryTime: "35 mins",
      isAvailable: true,
      description:
        "Arabica coffee beans, freshly roasted. Makes 40 cups of rich, aromatic coffee.",
    },
    {
      id: 6,
      name: "Running Shoes",
      price: 2999,
      originalPrice: 3999,
      discount: 25,
      rating: 4.4,
      reviews: 89,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop",
      shop: "SportZone",
      distance: "3.2 km",
      stock: 12,
      category: "fashion",
      deliveryTime: "1 hour",
      isAvailable: true,
      description:
        "Lightweight running shoes with advanced cushioning and breathable mesh upper.",
    },
    {
      id: 7,
      name: "Smart Watch",
      price: 5999,
      originalPrice: 7999,
      discount: 25,
      rating: 4.6,
      reviews: 234,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop",
      shop: "Gadget World",
      distance: "1.8 km",
      stock: 15,
      category: "electronics",
      deliveryTime: "45 mins",
      isAvailable: true,
      description:
        "Smart watch with heart rate monitoring, GPS, and 7-day battery life.",
    },
    {
      id: 8,
      name: "Yoga Mat",
      price: 899,
      rating: 4.8,
      reviews: 145,
      image:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop",
      shop: "Fitness First",
      distance: "2.5 km",
      stock: 30,
      category: "fashion",
      deliveryTime: "40 mins",
      isAvailable: true,
      description:
        "Non-slip yoga mat with 6mm thickness, perfect for all yoga practices.",
    },
    {
      id: 9,
      name: "LED Desk Lamp",
      price: 1299,
      originalPrice: 1599,
      discount: 19,
      rating: 4.5,
      reviews: 98,
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
      shop: "Home Essentials",
      distance: "1.3 km",
      stock: 22,
      category: "household",
      deliveryTime: "50 mins",
      isAvailable: true,
      description:
        "Adjustable LED desk lamp with touch control and multiple brightness levels.",
    },
    {
      id: 10,
      name: "Face Moisturizer",
      price: 499,
      rating: 4.7,
      reviews: 167,
      image:
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&h=200&fit=crop",
      shop: "Beauty Hub",
      distance: "0.9 km",
      stock: 18,
      category: "medicine",
      deliveryTime: "25 mins",
      isAvailable: true,
      description:
        "Hydrating face moisturizer with SPF 30, suitable for all skin types.",
    },
    {
      id: 11,
      name: "Notebook Set",
      price: 199,
      rating: 4.6,
      reviews: 89,
      image:
        "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&h=200&fit=crop",
      shop: "Stationery Plus",
      distance: "1.7 km",
      stock: 45,
      category: "household",
      deliveryTime: "30 mins",
      isAvailable: true,
      description:
        "Set of 3 ruled notebooks with hardcover, perfect for students and professionals.",
    },
    {
      id: 12,
      name: "Wall Clock",
      price: 799,
      originalPrice: 999,
      discount: 20,
      rating: 4.4,
      reviews: 76,
      image:
        "https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=300&h=200&fit=crop",
      shop: "Decor World",
      distance: "2.8 km",
      stock: 14,
      category: "household",
      deliveryTime: "1 hour",
      isAvailable: true,
      description:
        "Modern wall clock with silent movement and large, easy-to-read numbers.",
    },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shop.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      selectedCategory === "all" ||
      product.category === selectedCategory;
    const matchesPrice =
      product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
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
      case "newest":
        return b.id - a.id;
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
      <Header />

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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={priceRange[1]}
                  onChange={(e) =>
                    setPriceRange([priceRange[0], parseInt(e.target.value)])
                  }
                  className="w-24"
                />
                <span className="text-sm text-gray-600">₹{priceRange[1]}</span>
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
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg lg:hidden">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="w-full"
                  />
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
              Showing {sortedProducts.length} of {products.length} products
            </p>
          </div>

          {/* Products Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {sortedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <div
                        className="h-48 bg-cover bg-center"
                        style={{ backgroundImage: `url(${product.image})` }}
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
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
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-xs font-semibold">
                            {product.rating}
                          </span>
                        </div>
                      </div>

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
                          <span className="font-medium">{product.shop}</span>
                          <span>{product.reviews} reviews</span>
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
              {sortedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="hover:shadow-lg transition-all duration-300 border-0 overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="relative w-full md:w-48 h-32 flex-shrink-0">
                        <div
                          className="w-full h-full bg-cover bg-center rounded-lg"
                          style={{ backgroundImage: `url(${product.image})` }}
                        />
                        {product.discount && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                            {product.discount}% OFF
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
                              {product.description}
                            </p>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>
                                {product.distance} • {product.shop}
                              </span>
                              <span className="mx-2">•</span>
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{product.deliveryTime}</span>
                            </div>
                            <div className="flex items-center mb-3">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-semibold mr-2">
                                {product.rating}
                              </span>
                              <span className="text-gray-600">
                                ({product.reviews} reviews)
                              </span>
                            </div>
                          </div>

                          <div className="text-left md:text-right mt-4 md:mt-0">
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
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or browse different
                categories
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setPriceRange([0, 10000]);
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
