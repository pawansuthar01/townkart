"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  TrendingUp,
  ShoppingCart,
  Star,
  MapPin,
  Clock,
  Heart,
  Eye,
  Flame,
  Award,
  Zap,
  Filter,
  SlidersHorizontal,
  Grid,
  List,
  Users,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function TrendingCollectionPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("trending");
  const { addItem } = useCart();

  const trendingProducts = [
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
      trending: true,
      trendingRank: 1,
      salesThisWeek: 156,
      description:
        "Fresh, organic tomatoes grown without pesticides. Perfect for salads and cooking.",
      tags: ["Organic", "Fresh", "Healthy"],
    },
    {
      id: 2,
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
      trending: true,
      trendingRank: 2,
      salesThisWeek: 89,
      description:
        "Premium wireless headphones with noise cancellation and 30-hour battery life.",
      tags: ["Wireless", "Noise Cancelling", "Premium"],
    },
    {
      id: 3,
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
      trending: true,
      trendingRank: 3,
      salesThisWeek: 67,
      description:
        "Smart watch with heart rate monitoring, GPS, and 7-day battery life.",
      tags: ["Smart", "Fitness", "GPS"],
    },
    {
      id: 4,
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
      trending: true,
      trendingRank: 4,
      salesThisWeek: 134,
      description:
        "Arabica coffee beans, freshly roasted. Makes 40 cups of rich, aromatic coffee.",
      tags: ["Premium", "Fresh", "Arabica"],
    },
    {
      id: 5,
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
      trending: true,
      trendingRank: 5,
      salesThisWeek: 78,
      description:
        "Lightweight running shoes with advanced cushioning and breathable mesh upper.",
      tags: ["Running", "Comfort", "Lightweight"],
    },
    {
      id: 6,
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
      trending: true,
      trendingRank: 6,
      salesThisWeek: 92,
      description:
        "Grilled chicken breast with mixed greens, cherry tomatoes, cucumber, and house dressing.",
      tags: ["Healthy", "Grilled", "Fresh"],
    },
    {
      id: 7,
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
      trending: true,
      trendingRank: 7,
      salesThisWeek: 145,
      description:
        "Hydrating face moisturizer with SPF 30, suitable for all skin types.",
      tags: ["Skincare", "SPF", "Hydrating"],
    },
    {
      id: 8,
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
      trending: true,
      trendingRank: 8,
      salesThisWeek: 56,
      description:
        "Adjustable LED desk lamp with touch control and multiple brightness levels.",
      tags: ["LED", "Adjustable", "Touch Control"],
    },
  ];

  const sortedProducts = [...trendingProducts].sort((a, b) => {
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
        return a.trendingRank - b.trendingRank; // trending
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
      <section className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white py-16">
        <div className="w-full px-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <TrendingUp className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Trending Collection
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Discover the hottest products everyone's talking about! This
              collection features the most popular items with the highest sales
              and ratings.
            </p>

            {/* Collection Stats */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {trendingProducts.length}
                </div>
                <div className="text-white/80">Trending Items</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {trendingProducts.reduce(
                    (sum, p) => sum + p.salesThisWeek,
                    0,
                  )}
                </div>
                <div className="text-white/80">Total Sales</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {Math.round(
                    (trendingProducts.reduce((sum, p) => sum + p.rating, 0) /
                      trendingProducts.length) *
                      10,
                  ) / 10}
                </div>
                <div className="text-white/80">Avg Rating</div>
              </div>
            </div>

            {/* Trending Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
              <Flame className="h-5 w-5 text-yellow-300" />
              <span className="font-semibold">🔥 Hot This Week</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Controls */}
      <section className="py-6 px-4 bg-white border-b sticky top-[73px] z-40">
        <div className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                This Week's Hottest Picks
              </h2>
              <p className="text-gray-600">
                Sorted by popularity and customer demand
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="trending">Trending Order</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="distance">Nearest First</option>
                  <option value="newest">Recently Added</option>
                </select>
              </div>

              {/* View Mode */}
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-orange-500 text-white" : "text-gray-500"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-orange-500 text-white" : "text-gray-500"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Display */}
      <section className="py-8 px-4">
        <div className="w-full">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-0 bg-white cursor-pointer">
                    <CardContent className="p-0">
                      <div className="relative">
                        <div
                          className="h-48 bg-cover bg-center"
                          style={{ backgroundImage: `url(${product.image})` }}
                        />

                        {/* Trending Badge */}
                        <div className="absolute top-3 left-3">
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold flex items-center gap-1">
                            <Flame className="h-3 w-3" />#{product.trendingRank}
                          </Badge>
                        </div>

                        {/* Discount Badge */}
                        {product.discount && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-red-500 text-white font-bold">
                              {product.discount}% OFF
                            </Badge>
                          </div>
                        )}

                        {/* Rating */}
                        <div className="absolute bottom-3 left-3">
                          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-xs font-semibold">
                              {product.rating}
                            </span>
                            <span className="text-xs text-gray-600 ml-1">
                              ({product.reviews})
                            </span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="p-2 bg-white/90 hover:bg-white"
                            >
                              <Heart className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="p-2 bg-white/90 hover:bg-white"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Sales Indicator */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/80 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            🔥 {product.salesThisWeek} sold this week
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-2">
                            {product.name}
                          </h3>
                          <Award className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-4">
                          {product.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{product.distance}</span>
                          <span className="mx-2">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{product.deliveryTime}</span>
                        </div>

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
                          <span className="text-sm font-medium text-gray-700">
                            {product.shop}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <Badge
                            className={`${
                              product.isAvailable
                                ? "bg-green-500"
                                : "bg-gray-500"
                            } text-white`}
                          >
                            {product.isAvailable ? "In Stock" : "Out of Stock"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {product.stock} left
                          </span>
                        </div>

                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(product);
                          }}
                          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold"
                          disabled={!product.isAvailable}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {product.isAvailable ? "Add to Cart" : "Out of Stock"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300 border-0 overflow-hidden cursor-pointer">
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
                          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                            #{product.trendingRank}
                          </Badge>
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                                  {product.name}
                                </h3>
                                <Award className="h-5 w-5 text-orange-500" />
                                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                                  🔥 Trending
                                </Badge>
                              </div>

                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                {product.description}
                              </p>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-1 mb-3">
                                {product.tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>

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
                                <span className="mx-2">•</span>
                                <span className="text-orange-600 font-semibold">
                                  {product.salesThisWeek} sold this week
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
                              onClick={(e) => {
                                e.preventDefault();
                                handleAddToCart(product);
                              }}
                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium flex-1"
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
                </Link>
              ))}
            </div>
          )}

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" className="px-8">
              <Zap className="h-4 w-4 mr-2" />
              Load More Trending Products
            </Button>
          </div>
        </div>
      </section>

      {/* Why Trending Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-white to-orange-50">
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why These Products Are Trending
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our trending algorithm considers multiple factors to bring you the
              best products
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center p-6 border-0 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Sales Volume</h3>
              <p className="text-gray-600 text-sm">
                Products with highest sales numbers in the past week
              </p>
            </Card>

            <Card className="text-center p-6 border-0 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Customer Ratings</h3>
              <p className="text-gray-600 text-sm">
                Highly rated products with positive customer feedback
              </p>
            </Card>

            <Card className="text-center p-6 border-0 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Growth Rate</h3>
              <p className="text-gray-600 text-sm">
                Products showing significant increase in popularity
              </p>
            </Card>

            <Card className="text-center p-6 border-0 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Social Proof</h3>
              <p className="text-gray-600 text-sm">
                Products frequently viewed, wished for, and shared
              </p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
