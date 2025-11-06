"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Grid,
  List,
  ShoppingCart,
  Star,
  MapPin,
  Clock,
  Heart,
  Eye,
  Package,
  Gift,
  Sparkles,
  Crown,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function CollectionsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null,
  );
  const { addItem } = useCart();

  const collections = [
    {
      id: "trending",
      title: "Trending Now",
      subtitle: "Most popular products this week",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
      itemCount: 25,
      totalValue: 45000,
      avgRating: 4.6,
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      featured: true,
    },
    {
      id: "offers",
      title: "Special Offers",
      subtitle: "Up to 50% off on selected items",
      image:
        "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop",
      itemCount: 18,
      totalValue: 32000,
      avgRating: 4.4,
      icon: Gift,
      color: "from-red-500 to-orange-500",
      featured: true,
    },
    {
      id: "new",
      title: "New Arrivals",
      subtitle: "Latest products from top brands",
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=400&fit=crop",
      itemCount: 32,
      totalValue: 78000,
      avgRating: 4.7,
      icon: Package,
      color: "from-blue-500 to-teal-500",
      featured: true,
    },
    {
      id: "premium",
      title: "Premium Collection",
      subtitle: "Luxury items and high-end products",
      image:
        "https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=400&fit=crop",
      itemCount: 15,
      totalValue: 125000,
      avgRating: 4.8,
      icon: Crown,
      color: "from-yellow-500 to-amber-500",
      featured: false,
    },
  ];

  const allProducts = [
    // Trending Collection Products
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
      collection: "trending",
      description: "Fresh, organic tomatoes grown without pesticides.",
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
      collection: "trending",
      description: "Premium wireless headphones with noise cancellation.",
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
      collection: "offers",
      description: "Smart watch with heart rate monitoring and GPS.",
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
      collection: "new",
      description: "Arabica coffee beans, freshly roasted.",
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
      collection: "offers",
      description: "Lightweight running shoes with advanced cushioning.",
    },
    {
      id: 6,
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
      collection: "premium",
      description: "Hydrating face moisturizer with SPF 30.",
    },
  ];

  const filteredProducts = selectedCollection
    ? allProducts.filter((product) => product.collection === selectedCollection)
    : allProducts;

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
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-16">
        <div className="w-full px-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <Grid className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Product Collections
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Explore curated collections of amazing products, from trending
              items to special offers
            </p>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-12 px-4">
        <div className="w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Collections
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover hand-picked collections designed to make shopping easier
              and more enjoyable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className={`group hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden border-0 ${
                  selectedCollection === collection.id
                    ? "ring-2 ring-indigo-500"
                    : ""
                } ${collection.featured ? "relative" : ""}`}
              >
                {collection.featured && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold">
                      Featured
                    </Badge>
                  </div>
                )}

                <div className="relative h-48">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${collection.image})` }}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${collection.color} opacity-90 group-hover:opacity-80 transition-opacity`}
                  />

                  <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                      <div
                        className={`p-3 rounded-full bg-white/20 backdrop-blur-sm`}
                      >
                        <collection.icon className="h-6 w-6" />
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {collection.itemCount} items
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        {collection.title}
                      </h3>
                      <p className="text-white/90 text-sm mb-4">
                        {collection.subtitle}
                      </p>

                      <div className="flex items-center justify-between text-sm mb-4">
                        <div className="flex items-center">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>{collection.avgRating}</span>
                        </div>
                        <span>₹{collection.totalValue.toLocaleString()}</span>
                      </div>

                      <Button
                        onClick={() => setSelectedCollection(collection.id)}
                        className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold"
                      >
                        Explore Collection
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12 px-4 bg-white">
        <div className="w-full">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedCollection
                  ? collections.find((c) => c.id === selectedCollection)?.title
                  : "All Collection Products"}
              </h2>
              <p className="text-gray-600">
                {filteredProducts.length} products available
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode */}
              <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-indigo-500 text-white" : "text-gray-500"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-indigo-500 text-white" : "text-gray-500"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Clear Filter */}
              {selectedCollection && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedCollection(null)}
                >
                  Show All
                </Button>
              )}
            </div>
          </div>

          {/* Products Display */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredProducts.map((product) => (
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
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
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
                          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium"
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
              {filteredProducts.map((product) => (
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-indigo-600 transition-colors">
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
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium flex-1"
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
          {filteredProducts.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="px-8">
                Load More Products
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Package className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-6">
                This collection doesn't have any products yet
              </p>
              <Button
                onClick={() => setSelectedCollection(null)}
                variant="outline"
              >
                Browse All Collections
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
