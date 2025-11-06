"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Search,
  Filter,
  Grid,
  List,
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  ShoppingCart,
  Plus,
  Minus,
} from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const categoryName = params.name as string;
  const { addItem } = useCart();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [isLoading, setIsLoading] = useState(true);

  // Mock category data - replace with API call
  const categoryData = {
    grocery: {
      name: "Grocery",
      description: "Fresh produce and daily essentials",
      icon: "🛒",
      color: "from-green-500 to-green-600",
    },
    food: {
      name: "Food",
      description: "Restaurants and food delivery",
      icon: "🍕",
      color: "from-orange-500 to-red-500",
    },
    medicine: {
      name: "Medicine",
      description: "Pharmacy and healthcare",
      icon: "💊",
      color: "from-blue-500 to-blue-600",
    },
    fashion: {
      name: "Fashion",
      description: "Clothing and accessories",
      icon: "👕",
      color: "from-purple-500 to-pink-500",
    },
    electronics: {
      name: "Electronics",
      description: "Gadgets and electronics",
      icon: "📱",
      color: "from-gray-700 to-gray-800",
    },
    household: {
      name: "Household",
      description: "Home and kitchen essentials",
      icon: "🏠",
      color: "from-teal-500 to-cyan-500",
    },
  };

  const category = categoryData[categoryName as keyof typeof categoryData];

  // Mock products data - replace with API call based on category
  const products = [
    {
      id: 1,
      name: "Fresh Organic Tomatoes",
      price: 40,
      originalPrice: 50,
      discount: 20,
      rating: 4.8,
      reviews: 128,
      image:
        "https://images.unsplash.com/photo-1546470427-e9e826abd807?w=300&h=200&fit=crop",
      shop: "Fresh Mart",
      distance: "0.8 km",
      stock: 25,
      deliveryTime: "30 mins",
      description: "Fresh, organic tomatoes grown without pesticides.",
    },
    {
      id: 2,
      name: "Grilled Chicken Salad",
      price: 180,
      rating: 4.6,
      reviews: 95,
      image:
        "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop",
      shop: "Healthy Bites Cafe",
      distance: "1.2 km",
      stock: 15,
      deliveryTime: "45 mins",
      description:
        "Fresh grilled chicken with mixed greens and house dressing.",
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
      deliveryTime: "1 hour",
      description: "Premium wireless headphones with noise cancellation.",
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
      deliveryTime: "20 mins",
      description: "Effective pain relief medication.",
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
      deliveryTime: "35 mins",
      description: "Arabica coffee beans from Ethiopian highlands.",
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
      deliveryTime: "2 hours",
      description: "Comfortable running shoes with advanced cushioning.",
    },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.shop.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
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
      default: // popularity
        return b.reviews - a.reviews;
    }
  });

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [categoryName]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
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
              onClick: () => (window.location.href = "/categories"),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${category.color} text-white`}>
        <div className="w-full px-6 py-8">
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

          <div className="flex items-center gap-4">
            <div className="text-4xl">{category.icon}</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {category.name}
              </h1>
              <p className="text-white/90 text-lg">{category.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b shadow-sm">
        <div className="w-full px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="distance">Nearest First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
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
        </div>
      </div>

      {/* Products */}
      <div className="p-6">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              {sortedProducts.length}{" "}
              {sortedProducts.length === 1 ? "product" : "products"} found
            </p>
          </div>

          {sortedProducts.length === 0 ? (
            <EmptyState
              icon={<Search className="h-12 w-12" />}
              title="No products found"
              description="Try adjusting your search criteria or browse other categories."
            />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                      <div className="absolute top-3 left-3 space-y-2">
                        {product.discount && (
                          <Badge className="bg-red-500 text-white font-bold">
                            {product.discount}% OFF
                          </Badge>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="p-2">
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-2">
                          {product.name}
                        </h3>
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Shop Info */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {product.distance}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {product.deliveryTime}
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
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
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-gray-900">
                            ₹{product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {product.shop}
                        </Badge>
                      </div>

                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full townkart-gradient hover:opacity-90 font-medium"
                        size="sm"
                      >
                        Add to Cart
                      </Button>
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
                  className="group hover:shadow-lg transition-all duration-300 border-0 overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-6">
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <div
                          className="w-full h-full bg-cover bg-center rounded-lg"
                          style={{ backgroundImage: `url(${product.image})` }}
                        />
                        {product.discount && (
                          <Badge className="absolute -top-2 -left-2 bg-red-500 text-white text-xs">
                            {product.discount}% OFF
                          </Badge>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {product.name}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                              {product.description}
                            </p>

                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {product.distance} • {product.shop}
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {product.deliveryTime}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
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
                                {product.rating} ({product.reviews} reviews)
                              </span>
                            </div>
                          </div>

                          <div className="text-right ml-6">
                            <div className="flex items-center space-x-2 mb-4">
                              <span className="text-2xl font-bold text-gray-900">
                                ₹{product.price}
                              </span>
                              {product.originalPrice && (
                                <span className="text-lg text-gray-500 line-through">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>

                            <Button
                              onClick={() => handleAddToCart(product)}
                              className="townkart-gradient hover:opacity-90 font-medium"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
