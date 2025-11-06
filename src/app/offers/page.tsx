"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Gift,
  Percent,
  Clock,
  ShoppingCart,
  Star,
  MapPin,
  Truck,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

export default function OffersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addItem } = useCart();

  const offerCategories = [
    { id: "all", name: "All Offers", count: 45 },
    { id: "grocery", name: "Grocery", count: 12 },
    { id: "food", name: "Food", count: 8 },
    { id: "fashion", name: "Fashion", count: 15 },
    { id: "electronics", name: "Electronics", count: 6 },
    { id: "medicine", name: "Medicine", count: 4 },
  ];

  const offers = [
    {
      id: 1,
      title: "Fresh Produce Festival",
      description: "Up to 50% off on fresh fruits and vegetables",
      discount: "50%",
      validTill: "2024-12-31",
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
      category: "grocery",
      shop: "Fresh Mart",
      distance: "0.8 km",
      rating: 4.5,
      reviews: 128,
      products: [
        { name: "Organic Tomatoes", originalPrice: 50, offerPrice: 25 },
        { name: "Fresh Apples", originalPrice: 120, offerPrice: 80 },
        { name: "Green Vegetables Pack", originalPrice: 80, offerPrice: 40 },
      ],
    },
    {
      id: 2,
      title: "Restaurant Week Special",
      description: "Buy 1 Get 1 Free on selected restaurants",
      discount: "B1G1",
      validTill: "2024-12-25",
      image:
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop",
      category: "food",
      shop: "Foodie's Paradise",
      distance: "1.2 km",
      rating: 4.8,
      reviews: 95,
      products: [
        { name: "Pizza Margherita", originalPrice: 250, offerPrice: 125 },
        { name: "Chicken Burger", originalPrice: 180, offerPrice: 90 },
        { name: "Pasta Alfredo", originalPrice: 220, offerPrice: 110 },
      ],
    },
    {
      id: 3,
      title: "Electronics Bonanza",
      description: "Up to 30% off on electronics and gadgets",
      discount: "30%",
      validTill: "2024-12-28",
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
      category: "electronics",
      shop: "TechHub",
      distance: "2.1 km",
      rating: 4.6,
      reviews: 203,
      products: [
        { name: "Wireless Headphones", originalPrice: 2999, offerPrice: 2099 },
        { name: "Smart Watch", originalPrice: 7999, offerPrice: 5599 },
        { name: "Bluetooth Speaker", originalPrice: 1999, offerPrice: 1399 },
      ],
    },
    {
      id: 4,
      title: "Fashion Fiesta",
      description: "40% off on clothing and accessories",
      discount: "40%",
      validTill: "2024-12-30",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
      category: "fashion",
      shop: "Style Central",
      distance: "1.5 km",
      rating: 4.4,
      reviews: 156,
      products: [
        { name: "Designer T-Shirt", originalPrice: 1299, offerPrice: 779 },
        { name: "Running Shoes", originalPrice: 3999, offerPrice: 2399 },
        { name: "Leather Jacket", originalPrice: 5999, offerPrice: 3599 },
      ],
    },
    {
      id: 5,
      title: "Medicine Month",
      description: "25% off on medicines and healthcare products",
      discount: "25%",
      validTill: "2024-12-31",
      image:
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
      category: "medicine",
      shop: "City Pharmacy",
      distance: "0.5 km",
      rating: 4.9,
      reviews: 67,
      products: [
        { name: "Vitamin Supplements", originalPrice: 899, offerPrice: 674 },
        { name: "First Aid Kit", originalPrice: 499, offerPrice: 374 },
        { name: "Face Masks Pack", originalPrice: 199, offerPrice: 149 },
      ],
    },
    {
      id: 6,
      title: "Household Essentials Sale",
      description: "Buy 2 Get 1 Free on cleaning products",
      discount: "B2G1",
      validTill: "2024-12-26",
      image:
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
      category: "grocery",
      shop: "Home & Clean",
      distance: "1.8 km",
      rating: 4.3,
      reviews: 89,
      products: [
        { name: "Dish Soap", originalPrice: 149, offerPrice: 99 },
        { name: "Floor Cleaner", originalPrice: 299, offerPrice: 199 },
        { name: "Laundry Detergent", originalPrice: 399, offerPrice: 266 },
      ],
    },
  ];

  const filteredOffers =
    selectedCategory && selectedCategory !== "all"
      ? offers.filter((offer) => offer.category === selectedCategory)
      : offers;

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id || Math.random(),
      name: product.name,
      price: product.offerPrice,
      image:
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
      quantity: 1,
      shop: "Offer Shop",
      stock: 10,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-500 to-pink-600 text-white py-16">
        <div className="w-full px-4">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <Gift className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Special Offers & Deals
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Don't miss out on amazing deals! Get the best prices on your
              favorite products
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-4 bg-white border-b">
        <div className="w-full">
          <div className="flex flex-wrap justify-center gap-4">
            {offerCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? "bg-townkart-primary text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.name}
                <Badge className="ml-2 text-xs">{category.count}</Badge>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="py-12 px-4">
        <div className="w-full">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOffers.map((offer) => (
              <Card
                key={offer.id}
                className="group hover:shadow-2xl transition-all duration-500 overflow-hidden border-0 bg-white"
              >
                <div className="relative">
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(${offer.image})` }}
                  />

                  {/* Offer Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500 text-white font-bold text-lg px-3 py-1">
                      {offer.discount} OFF
                    </Badge>
                  </div>

                  {/* Valid Till */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-700">
                        Till {new Date(offer.validTill).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Shop Rating */}
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-xs font-semibold">
                        {offer.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {offer.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {offer.description}
                    </p>

                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>
                        {offer.distance} • {offer.shop}
                      </span>
                      <span className="mx-2">•</span>
                      <span>{offer.reviews} reviews</span>
                    </div>
                  </div>

                  {/* Sample Products */}
                  <div className="space-y-2 mb-6">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Sample Deals:
                    </h4>
                    {offer.products.slice(0, 2).map((product, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-700">{product.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-500 line-through">
                            ₹{product.originalPrice}
                          </span>
                          <span className="font-bold text-green-600">
                            ₹{product.offerPrice}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold"
                      onClick={() => handleAddToCart(offer.products[0])}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Shop Now
                    </Button>
                    <Button variant="outline" className="px-4">
                      View All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {filteredOffers.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg" className="px-8">
                Load More Offers
              </Button>
            </div>
          )}

          {/* Empty State */}
          {filteredOffers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Percent className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No offers found
              </h3>
              <p className="text-gray-600">
                Check back later for new deals and offers
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-12 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="w-full text-center">
          <h2 className="text-3xl font-bold mb-4">Never Miss a Deal!</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Subscribe to get exclusive offers and deals delivered to your inbox
          </p>
          <div className="max-w-md mx-auto flex gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-white text-gray-900 border-0 rounded-lg"
            />
            <Button className="townkart-gradient hover:opacity-90 px-6 font-medium">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
