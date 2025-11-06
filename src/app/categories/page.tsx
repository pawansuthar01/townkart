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
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CategoriesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const { addItem } = useCart();

  const categories = [
    {
      id: "grocery",
      name: "Grocery",
      icon: ShoppingCart,
      count: 245,
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=200&fit=crop",
      color: "from-green-500 to-green-600",
      description: "Fresh produce & daily essentials",
    },
    {
      id: "food",
      name: "Food",
      icon: ShoppingCart,
      count: 189,
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300&h=200&fit=crop",
      color: "from-orange-500 to-red-500",
      description: "Restaurants & food delivery",
    },
    {
      id: "medicine",
      name: "Medicine",
      icon: ShoppingCart,
      count: 67,
      image:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop",
      color: "from-blue-500 to-blue-600",
      description: "Pharmacy & healthcare",
    },
    {
      id: "fashion",
      name: "Fashion",
      icon: ShoppingCart,
      count: 134,
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
      color: "from-purple-500 to-pink-500",
      description: "Clothing & accessories",
    },
    {
      id: "electronics",
      name: "Electronics",
      icon: ShoppingCart,
      count: 89,
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=200&fit=crop",
      color: "from-gray-700 to-gray-800",
      description: "Gadgets & electronics",
    },
    {
      id: "household",
      name: "Household",
      icon: ShoppingCart,
      count: 156,
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop",
      color: "from-teal-500 to-cyan-500",
      description: "Home & kitchen essentials",
    },
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
    },
  ];

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
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white py-16">
        <div className="w-full px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Shop by Categories
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Discover products from your favorite categories with fast delivery
              and great prices
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white text-gray-900 border-0 rounded-full shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 px-4">
        <div className="w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Categories
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose from our wide range of categories to find exactly what
              you're looking for
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.id}`}>
                <Card
                  className={`group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-full border-0 ${
                    selectedCategory === category.id
                      ? "ring-2 ring-townkart-primary"
                      : ""
                  }`}
                >
                  <div className="relative h-32 md:h-40">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${category.image})` }}
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-90 group-hover:opacity-80 transition-opacity`}
                    />
                    <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                      <div className="flex justify-between items-start">
                        <div
                          className={`p-2 rounded-full bg-white/20 backdrop-blur-sm`}
                        >
                          <category.icon className="h-4 w-4" />
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          {category.count}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold mb-1">
                          {category.name}
                        </h3>
                        <p className="text-xs text-white/90 mb-2">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 px-4 bg-white">
        <div className="w-full">
          {/* Filters and Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                All Products
              </h2>
              <p className="text-gray-600">
                {filteredProducts.length} products found
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-townkart-primary"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-townkart-primary"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="distance">Nearest First</option>
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
            </div>
          </div>

          {/* Products Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {sortedProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0"
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

                      {/* Content */}
                      <div className="p-4">
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

      <Footer />
    </div>
  );
}
