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
  Search,
  MapPin,
  Star,
  Clock,
  Truck,
  Phone,
  Store,
  Filter,
  Grid,
  List,
  Heart,
  Eye,
  ShoppingBag,
} from "lucide-react";

export default function ShopsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "all", name: "All Shops", count: 156 },
    { id: "grocery", name: "Grocery", count: 45 },
    { id: "food", name: "Food", count: 32 },
    { id: "medicine", name: "Medicine", count: 18 },
    { id: "fashion", name: "Fashion", count: 28 },
    { id: "electronics", name: "Electronics", count: 22 },
    { id: "household", name: "Household", count: 11 },
  ];

  const shops = [
    {
      id: 1,
      name: "Fresh Mart",
      category: "grocery",
      rating: 4.8,
      reviews: 245,
      distance: "0.8 km",
      deliveryTime: "30 mins",
      deliveryFee: "Free",
      minOrder: 100,
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
      isOpen: true,
      isVerified: true,
      totalProducts: 156,
      joinedDate: "2022-03-15",
      description:
        "Fresh fruits, vegetables, and daily essentials delivered to your doorstep.",
      specialties: ["Organic Produce", "Fresh Dairy", "Bakery Items"],
      workingHours: "6:00 AM - 10:00 PM",
      phone: "+91 98765 43210",
    },
    {
      id: 2,
      name: "TechHub Electronics",
      category: "electronics",
      rating: 4.6,
      reviews: 189,
      distance: "2.1 km",
      deliveryTime: "1-2 hours",
      deliveryFee: "₹50",
      minOrder: 500,
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
      isOpen: true,
      isVerified: true,
      totalProducts: 89,
      joinedDate: "2021-08-20",
      description:
        "Latest electronics, gadgets, and accessories with warranty and installation.",
      specialties: ["Smartphones", "Laptops", "Audio Devices"],
      workingHours: "10:00 AM - 9:00 PM",
      phone: "+91 98765 43211",
    },
    {
      id: 3,
      name: "Healthy Bites Cafe",
      category: "food",
      rating: 4.7,
      reviews: 312,
      distance: "1.2 km",
      deliveryTime: "45 mins",
      deliveryFee: "Free",
      minOrder: 200,
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      isOpen: true,
      isVerified: true,
      totalProducts: 67,
      joinedDate: "2023-01-10",
      description:
        "Healthy and delicious food options for fitness enthusiasts.",
      specialties: ["Salads", "Smoothies", "Healthy Meals"],
      workingHours: "7:00 AM - 9:00 PM",
      phone: "+91 98765 43212",
    },
    {
      id: 4,
      name: "City Pharmacy",
      category: "medicine",
      rating: 4.9,
      reviews: 156,
      distance: "0.5 km",
      deliveryTime: "20 mins",
      deliveryFee: "Free",
      minOrder: 50,
      image:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
      isOpen: true,
      isVerified: true,
      totalProducts: 234,
      joinedDate: "2020-05-15",
      description:
        "24/7 pharmacy with prescription delivery and health consultations.",
      specialties: [
        "Prescription Drugs",
        "Health Supplements",
        "Medical Supplies",
      ],
      workingHours: "24/7",
      phone: "+91 98765 43213",
    },
    {
      id: 5,
      name: "Fashion Central",
      category: "fashion",
      rating: 4.4,
      reviews: 278,
      distance: "3.2 km",
      deliveryTime: "1 hour",
      deliveryFee: "₹30",
      minOrder: 300,
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      isOpen: true,
      isVerified: false,
      totalProducts: 145,
      joinedDate: "2022-11-08",
      description: "Trendy fashion and lifestyle products for all ages.",
      specialties: ["Clothing", "Accessories", "Footwear"],
      workingHours: "9:00 AM - 8:00 PM",
      phone: "+91 98765 43214",
    },
    {
      id: 6,
      name: "Home Essentials",
      category: "household",
      rating: 4.5,
      reviews: 198,
      distance: "1.8 km",
      deliveryTime: "50 mins",
      deliveryFee: "Free",
      minOrder: 150,
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      isOpen: false,
      isVerified: true,
      totalProducts: 98,
      joinedDate: "2021-12-01",
      description:
        "Everything you need for your home - cleaning, kitchen, and decor items.",
      specialties: ["Cleaning Supplies", "Kitchenware", "Home Decor"],
      workingHours: "8:00 AM - 7:00 PM",
      phone: "+91 98765 43215",
    },
  ];

  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shop.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      selectedCategory === "all" ||
      shop.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16">
        <div className="w-full px-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <Store className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Discover Local Shops
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Explore amazing local businesses and get fresh products delivered
              to your doorstep
            </p>

            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search shops..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white text-gray-900 border-0 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 px-4 bg-white border-b">
        <div className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedCategory && selectedCategory !== "all"
                  ? `${categories.find((c) => c.id === selectedCategory)?.name} Shops`
                  : "All Shops"}
              </h2>
              <p className="text-gray-600">
                {filteredShops.length} shops available
              </p>
            </div>

            <div className="flex items-center gap-4">
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

      {/* Shops Display */}
      <section className="py-8 px-4">
        <div className="w-full">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map((shop) => (
                <Card
                  key={shop.id}
                  className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <div
                        className="h-48 bg-cover bg-center"
                        style={{ backgroundImage: `url(${shop.image})` }}
                      />

                      {/* Status Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <Badge
                          className={`${
                            shop.isOpen ? "bg-green-500" : "bg-red-500"
                          } text-white font-bold`}
                        >
                          {shop.isOpen ? "Open" : "Closed"}
                        </Badge>
                        {shop.isVerified && (
                          <Badge className="bg-blue-500 text-white">
                            Verified
                          </Badge>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-xs font-semibold">
                            {shop.rating}
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

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 flex-1 mr-2">
                          {shop.name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {shop.category}
                        </Badge>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {shop.description}
                      </p>

                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{shop.distance}</span>
                        <span className="mx-2">•</span>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{shop.deliveryTime}</span>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm">
                          <span className="text-gray-600">Min order: </span>
                          <span className="font-semibold">
                            ₹{shop.minOrder}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600">Delivery: </span>
                          <span className="font-semibold">
                            {shop.deliveryFee}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span>{shop.totalProducts} products</span>
                        <span>{shop.reviews} reviews</span>
                      </div>

                      <Link href={`/shops/${shop.id}`}>
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Visit Shop
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredShops.map((shop) => (
                <Card
                  key={shop.id}
                  className="group hover:shadow-lg transition-all duration-300 border-0 overflow-hidden cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="relative w-full md:w-48 h-32 flex-shrink-0">
                        <div
                          className="w-full h-full bg-cover bg-center rounded-lg"
                          style={{ backgroundImage: `url(${shop.image})` }}
                        />
                        <div className="absolute top-2 left-2">
                          <Badge
                            className={`${
                              shop.isOpen ? "bg-green-500" : "bg-red-500"
                            } text-white font-bold text-xs`}
                          >
                            {shop.isOpen ? "Open" : "Closed"}
                          </Badge>
                        </div>
                        {shop.isVerified && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-blue-500 text-white text-xs">
                              Verified
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                                {shop.name}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {shop.category}
                              </Badge>
                              {shop.isVerified && (
                                <Badge className="bg-blue-500 text-white text-xs">
                                  ✓ Verified
                                </Badge>
                              )}
                            </div>

                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {shop.description}
                            </p>

                            <div className="flex flex-wrap gap-1 mb-3">
                              {shop.specialties
                                .slice(0, 3)
                                .map((specialty, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {specialty}
                                  </Badge>
                                ))}
                            </div>

                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>
                                {shop.distance} • {shop.workingHours}
                              </span>
                              <span className="mx-2">•</span>
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{shop.deliveryTime}</span>
                            </div>

                            <div className="flex items-center mb-3">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-semibold mr-2">
                                {shop.rating}
                              </span>
                              <span className="text-gray-600">
                                ({shop.reviews} reviews)
                              </span>
                              <span className="mx-2">•</span>
                              <span className="text-gray-600">
                                {shop.totalProducts} products
                              </span>
                            </div>
                          </div>

                          <div className="text-left md:text-right mt-4 md:mt-0">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="text-sm">
                                <span className="text-gray-600">
                                  Min order:
                                </span>
                                <div className="font-semibold">
                                  ₹{shop.minOrder}
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">Delivery:</span>
                                <div className="font-semibold">
                                  {shop.deliveryFee}
                                </div>
                              </div>
                            </div>
                            <Badge
                              className={`mb-3 ${
                                shop.isOpen ? "bg-green-500" : "bg-red-500"
                              } text-white`}
                            >
                              {shop.isOpen
                                ? "Currently Open"
                                : "Currently Closed"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Link href={`/shops/${shop.id}`}>
                            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium flex-1">
                              <ShoppingBag className="h-4 w-4 mr-2" />
                              Visit Shop
                            </Button>
                          </Link>
                          <Button variant="outline" className="px-4">
                            <Phone className="h-4 w-4 mr-2" />
                            Call
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
          {filteredShops.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="px-8">
                Load More Shops
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredShops.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Store className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No shops found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or browse different
                categories
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

      {/* Join as Merchant CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-green-500 to-teal-600 text-white">
        <div className="w-full text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Want to Join Our Platform?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Start your own shop on TownKart and reach thousands of customers in
            your area
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/merchant/join">
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8"
              >
                Join as Merchant
              </Button>
            </Link>
            <Link href="/rider/join">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-green-600 font-semibold px-8"
              >
                Become a Rider
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
