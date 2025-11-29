"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Percent,
  Clock,
  ShoppingCart,
  Star,
  MapPin,
  Truck,
  RefreshCw,
  Tag,
  Check,
  X,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface Offer {
  id: string;
  title: string;
  description: string;
  type: string;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  applicableTo: string;
  productIds?: string[];
  categoryIds?: string[];
  merchantIds?: string[];
  targetUsers: string;
  userIds?: string[];
  userSegments?: string[];
  usageLimit?: number;
  perUserLimit: number;
  usedCount: number;
  couponCode?: string;
  isAutoApply: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: string;
  priority: number;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  // Additional display fields
  storeName?: string;
  storeRating?: number;
  storeDistance?: string;
  products?: Array<{
    name: string;
    originalPrice: number;
    offerPrice: number;
  }>;
}

export default function OffersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; count: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState<{
    isValid: boolean;
    message: string;
    discount?: number;
    description?: string;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/offers");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOffers(data.offers);
          // Calculate category counts
          const categoryCounts: Record<string, number> = {};
          data.offers.forEach((offer: Offer) => {
            // This would need to be enhanced based on actual offer categorization
            const category = "all"; // Default category
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          });
          setCategories([
            { id: "all", name: "All Offers", count: data.offers.length },
            {
              id: "grocery",
              name: "Grocery",
              count: categoryCounts.grocery || 0,
            },
            { id: "food", name: "Food", count: categoryCounts.food || 0 },
            {
              id: "fashion",
              name: "Fashion",
              count: categoryCounts.fashion || 0,
            },
            {
              id: "electronics",
              name: "Electronics",
              count: categoryCounts.electronics || 0,
            },
            {
              id: "medicine",
              name: "Medicine",
              count: categoryCounts.medicine || 0,
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const offerCategories = categories;

  const filteredOffers = offers; // For now, show all offers

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

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponValidation({
        isValid: false,
        message: "Please enter a coupon code",
      });
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          cartTotal: 500, // Sample cart total for validation
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCouponValidation({
          isValid: true,
          message: "Coupon applied successfully!",
          discount: data.data.discount,
          description: data.data.description,
        });
      } else {
        setCouponValidation({
          isValid: false,
          message: data.message,
        });
      }
    } catch (error) {
      setCouponValidation({
        isValid: false,
        message: "Failed to validate coupon. Please try again.",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const getOfferDiscountDisplay = (offer: Offer) => {
    switch (offer.type) {
      case "PERCENTAGE_DISCOUNT":
        return `${offer.discountValue}% OFF`;
      case "FIXED_DISCOUNT":
        return `₹${offer.discountValue} OFF`;
      case "FREE_SHIPPING":
        return "FREE SHIPPING";
      case "BUY_ONE_GET_ONE":
        return "BUY 1 GET 1";
      case "BUNDLE_DISCOUNT":
        return `${offer.discountValue}% OFF`;
      default:
        return `${offer.discountValue}% OFF`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Coupon Application Section */}
      <section className="py-8 px-4 bg-blue-50">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Tag className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Apply Coupon Code
              </h2>
            </div>

            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code (e.g., SAVE20)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === "Enter" && handleValidateCoupon()}
              />
              <button
                onClick={handleValidateCoupon}
                disabled={isValidatingCoupon || !couponCode.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isValidatingCoupon ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </button>
            </div>

            {couponValidation && (
              <div
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  couponValidation.isValid
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {couponValidation.isValid ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <X className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      couponValidation.isValid
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {couponValidation.message}
                  </p>
                  {couponValidation.isValid && couponValidation.discount && (
                    <p className="text-sm text-green-700">
                      You save ₹{couponValidation.discount} with this coupon!
                    </p>
                  )}
                  {couponValidation.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {couponValidation.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600">
              <p className="mb-2">
                <strong>How to use coupons:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enter your coupon code in the field above</li>
                <li>Coupon codes are case-insensitive</li>
                <li>Some coupons have minimum order requirements</li>
                <li>Coupons can be combined with other offers</li>
              </ul>
            </div>
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
                    style={{
                      backgroundImage: `url(https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop)`,
                    }}
                  />

                  {/* Offer Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500 text-white font-bold text-lg px-3 py-1">
                      {getOfferDiscountDisplay(offer)}
                    </Badge>
                  </div>

                  {/* Valid Till */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-700">
                        Till {new Date(offer.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Store Rating */}
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-xs font-semibold">
                        {offer.storeRating || 4.5}
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
                        {offer.storeDistance || "1.2 km"} •{" "}
                        {offer.storeName || "Store"}
                      </span>
                    </div>
                  </div>

                  {/* Terms */}
                  {offer.terms && (
                    <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded">
                      {offer.terms}
                    </div>
                  )}

                  {/* Coupon Code */}
                  {offer.couponCode && (
                    <div className="mb-4">
                      <Badge variant="outline" className="font-mono">
                        Code: {offer.couponCode}
                      </Badge>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold"
                      onClick={() => {
                        /* Navigate to store or products */
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      View Deals
                    </Button>
                    <Button variant="outline" className="px-4">
                      Details
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
    </div>
  );
}
