"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useProducts } from "@/hooks/useProducts";
import { useCollections } from "@/hooks/useCollections";

export default function CollectionsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const { addItem } = useCart();
  const {
    getTrendingProducts,
    getSaleProducts,
    getFeaturedProducts,
    getProducts,
    products,
    isLoading: productsLoading,
  } = useProducts();
  const {
    collections,
    getActiveCollections,
    isLoading: collectionsLoading,
    error,
  } = useCollections();

  // Load collections on component mount
  useEffect(() => {
    getActiveCollections();
  }, [getActiveCollections]);

  // Load products based on selected collection
  useEffect(() => {
    if (selectedCollection) {
      // Load products for the selected collection
      getProducts({ category: selectedCollection });
    } else {
      // Load all products
      getTrendingProducts();
    }
  }, [selectedCollection, getProducts, getTrendingProducts]);

  // No need to filter client-side since we're fetching specific collection products
  const filteredProducts = products;

  // Filter collections by search term (if we add search functionality later)
  const filteredCollections = collections;

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      image: product.primaryImage || product.images?.[0] || "",
      quantity: 1,
      shop: product.merchant.businessName,
      stock: product.stockQuantity,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
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

          {collectionsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {filteredCollections.map((collection) => (
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
                      style={{
                        backgroundImage: `url(${collection.image || "/placeholder-collection.jpg"})`,
                      }}
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-t ${collection.color || "from-gray-500 to-gray-600"} opacity-90 group-hover:opacity-80 transition-opacity`}
                    />

                    <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                      <div className="flex justify-between items-start">
                        <div
                          className={`p-3 rounded-full bg-white/20 backdrop-blur-sm`}
                        >
                          {collection.icon === "Sparkles" && (
                            <Sparkles className="h-6 w-6" />
                          )}
                          {collection.icon === "Gift" && (
                            <Gift className="h-6 w-6" />
                          )}
                          {collection.icon === "Package" && (
                            <Package className="h-6 w-6" />
                          )}
                          {collection.icon === "Crown" && (
                            <Crown className="h-6 w-6" />
                          )}
                        </div>
                        <Badge className="bg-white/20 text-white border-white/30">
                          {collection._count?.products || 0} items
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          {collection.name}
                        </h3>
                        <p className="text-white/90 text-sm mb-4">
                          {collection.description || "Explore amazing products"}
                        </p>

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
          )}
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
                  ? collections.find((c) => c.id === selectedCollection)?.name
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
          {productsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : viewMode === "grid" ? (
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
                        style={{
                          backgroundImage: `url(${product.primaryImage || product.images?.[0] || "/placeholder-product.jpg"})`,
                        }}
                      />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.discountedPrice &&
                          product.discountedPrice < product.price && (
                            <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs">
                              {Math.round(
                                ((product.price - product.discountedPrice) /
                                  product.price) *
                                  100
                              )}
                              % OFF
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
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
                          {product.name}
                        </h3>

                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>2.1 km</span>
                          <span className="mx-2">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>45 mins</span>
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
                            {product?.store?.name}
                          </span>
                          <span>{product.totalReviews || 0} reviews</span>
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
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-indigo-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {product.shortDescription || product.description}
                            </p>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>2.1 km • {product?.store?.name}</span>
                              <span className="mx-2">•</span>
                              <Clock className="h-4 w-4 mr-1" />
                              <span>45 mins</span>
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
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:-purple-700 text-white font-medium flex-1"
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
          {filteredProducts.length === 0 && !productsLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Package className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedCollection
                  ? "This collection doesn't have any products yet"
                  : "No products available at the moment"}
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
    </div>
  );
}
