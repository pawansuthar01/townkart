"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  ShoppingCart,
  Star,
  MapPin,
  Clock,
  Truck,
  Phone,
  Heart,
  Eye,
  Search,
  Filter,
  Grid,
  List,
  Minus,
  Plus,
  ArrowLeft,
  Share2,
  Shield,
  Award,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface ShopDetailPageProps {
  params: {
    shopId: string;
  };
}

export default function ShopDetailPage({ params }: ShopDetailPageProps) {
  const [quantity, setQuantity] = useState<{ [key: string]: number }>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addItem } = useCart();

  // Mock shop data - in real app, fetch based on shopId
  const shop = {
    id: parseInt(params.shopId),
    name: "Fresh Mart",
    category: "grocery",
    rating: 4.8,
    reviews: 245,
    distance: "0.8 km",
    deliveryTime: "30 mins",
    deliveryFee: "Free",
    minOrder: 100,
    image:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop",
    isOpen: true,
    isVerified: true,
    totalProducts: 156,
    joinedDate: "2022-03-15",
    description:
      "Fresh fruits, vegetables, and daily essentials delivered to your doorstep. We source our products directly from local farmers to ensure maximum freshness.",
    specialties: ["Organic Produce", "Fresh Dairy", "Bakery Items"],
    workingHours: "6:00 AM - 10:00 PM",
    phone: "+91 98765 43210",
    address: "123 Market Street, Downtown, Bangalore - 560001",
    owner: "Rajesh Kumar",
    established: "2018",
  };

  const categories = [
    { id: "all", name: "All Products", count: 156 },
    { id: "fruits", name: "Fruits", count: 45 },
    { id: "vegetables", name: "Vegetables", count: 38 },
    { id: "dairy", name: "Dairy", count: 23 },
    { id: "bakery", name: "Bakery", count: 18 },
    { id: "beverages", name: "Beverages", count: 15 },
    { id: "snacks", name: "Snacks", count: 17 },
  ];

  const products = [
    {
      id: 1,
      name: "Fresh Organic Tomatoes",
      price: 40,
      originalPrice: 50,
      discount: 20,
      rating: 4.5,
      reviews: 23,
      image:
        "https://images.unsplash.com/photo-1546470427-e9e826abd807?w=300&h=200&fit=crop",
      category: "vegetables",
      unit: "500g",
      stock: 25,
      isAvailable: true,
      description: "Fresh, organic tomatoes grown without pesticides.",
      tags: ["Organic", "Fresh", "Healthy"],
    },
    {
      id: 2,
      name: "Farm Fresh Milk",
      price: 65,
      rating: 4.7,
      reviews: 45,
      image:
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&h=200&fit=crop",
      category: "dairy",
      unit: "1L",
      stock: 15,
      isAvailable: true,
      description: "Pure, fresh cow milk from local dairy farms.",
      tags: ["Fresh", "Pure", "Local"],
    },
    {
      id: 3,
      name: "Whole Wheat Bread",
      price: 35,
      rating: 4.3,
      reviews: 18,
      image:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=200&fit=crop",
      category: "bakery",
      unit: "400g",
      stock: 12,
      isAvailable: true,
      description: "Freshly baked whole wheat bread with no preservatives.",
      tags: ["Whole Wheat", "Fresh", "Healthy"],
    },
    {
      id: 4,
      name: "Organic Bananas",
      price: 60,
      rating: 4.6,
      reviews: 31,
      image:
        "https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=300&h=200&fit=crop",
      category: "fruits",
      unit: "1kg",
      stock: 20,
      isAvailable: true,
      description: "Sweet, organic bananas rich in potassium.",
      tags: ["Organic", "Sweet", "Healthy"],
    },
    {
      id: 5,
      name: "Fresh Spinach",
      price: 25,
      rating: 4.4,
      reviews: 15,
      image:
        "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=200&fit=crop",
      category: "vegetables",
      unit: "200g",
      stock: 18,
      isAvailable: true,
      description: "Fresh, green spinach leaves packed with nutrients.",
      tags: ["Fresh", "Green", "Nutritious"],
    },
    {
      id: 6,
      name: "Greek Yogurt",
      price: 85,
      originalPrice: 95,
      discount: 11,
      rating: 4.8,
      reviews: 27,
      image:
        "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=200&fit=crop",
      category: "dairy",
      unit: "500g",
      stock: 10,
      isAvailable: true,
      description: "Thick, creamy Greek yogurt with live cultures.",
      tags: ["Greek", "Probiotic", "Creamy"],
    },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      selectedCategory === "all" ||
      product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: any) => {
    const qty = quantity[product.id] || 1;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qty,
      shop: shop.name,
      stock: product.stock,
    });
  };

  const handleQuantityChange = (productId: string, change: number) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (!product) return;

    setQuantity((prev) => ({
      ...prev,
      [productId]: Math.max(
        1,
        Math.min(product.stock, (prev[productId] || 1) + change),
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Shop Header */}
      <section className="relative">
        <div
          className="h-64 bg-cover bg-center"
          style={{ backgroundImage: `url(${shop.image})` }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Link href="/shops">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shops
            </Button>
          </Link>
        </div>

        {/* Shop Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {shop.name}
                  </h1>
                  {shop.isVerified && (
                    <Badge className="bg-blue-500 text-white">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  <Badge
                    className={`${
                      shop.isOpen ? "bg-green-500" : "bg-red-500"
                    } text-white`}
                  >
                    {shop.isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center text-white">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-semibold">{shop.rating}</span>
                    <span className="ml-1">({shop.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center text-white">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{shop.distance}</span>
                  </div>
                  <div className="flex items-center text-white">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{shop.deliveryTime}</span>
                  </div>
                </div>

                <p className="text-white/90 text-sm max-w-2xl">
                  {shop.description}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Favorite
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="secondary"
                  className="bg-white/90 hover:bg-white"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Details */}
      <section className="py-6 px-4 bg-white border-b">
        <div className="w-full">
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {shop.totalProducts}
              </div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {shop.rating}
              </div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {shop.reviews}
              </div>
              <div className="text-sm text-gray-600">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {shop.distance}
              </div>
              <div className="text-sm text-gray-600">Distance</div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Info */}
      <section className="py-4 px-4 bg-blue-50">
        <div className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center text-sm">
                <Truck className="h-4 w-4 text-blue-600 mr-2" />
                <span className="font-semibold">
                  Delivery: {shop.deliveryFee}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-blue-600 mr-2" />
                <span>{shop.deliveryTime}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="font-semibold">
                  Min Order: ₹{shop.minOrder}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Working Hours: {shop.workingHours}
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-6 px-4 bg-white border-b sticky top-[73px] z-40">
        <div className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedCategory && selectedCategory !== "all"
                  ? `${categories.find((c) => c.id === selectedCategory)?.name}`
                  : "All Products"}
              </h2>
              <p className="text-gray-600">
                {filteredProducts.length} products available
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
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
      </section>

      {/* Products Display */}
      <section className="py-8 px-4">
        <div className="w-full">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden border-0 bg-white"
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
                          <Badge className="bg-red-500 text-white font-bold">
                            {product.discount}% OFF
                          </Badge>
                        )}
                        <Badge
                          className={`${
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
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span>Unit: {product.unit}</span>
                        <span className="mx-2">•</span>
                        <span>{product.reviews} reviews</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.tags.slice(0, 2).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-4">
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
                        <span className="text-xs text-gray-500">
                          {product.stock} left
                        </span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(product.id.toString(), -1)
                            }
                            disabled={(quantity[product.id] || 1) <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-semibold w-8 text-center">
                            {quantity[product.id] || 1}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(product.id.toString(), 1)
                            }
                            disabled={
                              (quantity[product.id] || 1) >= product.stock
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-gray-500">
                          Max: {product.stock}
                        </span>
                      </div>

                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold"
                        disabled={!product.isAvailable}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart - ₹
                        {product.price * (quantity[product.id] || 1)}
                      </Button>
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
                  className="group hover:shadow-lg transition-all duration-300 border-0 overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="relative w-32 h-32 flex-shrink-0">
                        <div
                          className="w-full h-full bg-cover bg-center rounded-lg"
                          style={{ backgroundImage: `url(${product.image})` }}
                        />
                        {product.discount && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                            {product.discount}% OFF
                          </Badge>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {product.description}
                            </p>

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
                              <span>Unit: {product.unit}</span>
                              <span className="mx-2">•</span>
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                              <span>
                                {product.rating} ({product.reviews} reviews)
                              </span>
                            </div>
                          </div>

                          <div className="text-right ml-4">
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
                              } text-white text-xs mb-2`}
                            >
                              {product.isAvailable
                                ? "In Stock"
                                : "Out of Stock"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(
                                    product.id.toString(),
                                    -1,
                                  )
                                }
                                disabled={(quantity[product.id] || 1) <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-semibold w-8 text-center">
                                {quantity[product.id] || 1}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleQuantityChange(product.id.toString(), 1)
                                }
                                disabled={
                                  (quantity[product.id] || 1) >= product.stock
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-xs text-gray-500">
                              Stock: {product.stock}
                            </span>
                          </div>

                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
                            disabled={!product.isAvailable}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart - ₹
                            {product.price * (quantity[product.id] || 1)}
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
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or browse different categories
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Shop Information */}
      <section className="py-12 px-4 bg-white">
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-8">About {shop.name}</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Shop Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium">{shop.owner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Established:</span>
                    <span className="font-medium">{shop.established}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Joined TownKart:</span>
                    <span className="font-medium">{shop.joinedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Products:</span>
                    <span className="font-medium">{shop.totalProducts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-600 mr-3" />
                    <span>{shop.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-600 mr-3 mt-1" />
                    <span className="text-sm">{shop.address}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-600 mr-3" />
                    <span>{shop.workingHours}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {shop.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  <Award className="h-3 w-3 mr-1" />
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
