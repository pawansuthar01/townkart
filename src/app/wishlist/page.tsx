"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  ShoppingCart,
  Star,
  Eye,
  Trash2,
  Loader2,
  Package,
  ArrowLeft,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import {
  ImageWithFallback,
  getDefaultImage,
} from "@/components/shared/ImageWithFallback";

export default function WishlistPage() {
  const { isAuthenticated, user } = useAuth();
  const { addItem } = useCart();
  const { items, removeItem, isLoading, isAnimating } = useWishlist();
  const [loading, setLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = "/auth/login";
    }
  }, [isAuthenticated]);

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      shop: product.shop,
      stock: 100, // Default stock, should be fetched from API
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    removeItem(productId);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Please login to view your wishlist
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access your wishlist
            </p>
            <Link href="/auth/login">
              <Button className="townkart-gradient">Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-townkart-primary" />
          <span className="ml-2 text-gray-600">Loading wishlist...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white py-12">
        <div className="w-full px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">My Wishlist</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Your saved items for later purchase
            </p>
            <Link href="/products">
              <Button
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Wishlist Content */}
      <section className="py-8">
        <div className="container-max">
          {/* Stats */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="text-lg font-semibold text-gray-900">
                    {items.length} items in wishlist
                  </span>
                </div>
              </div>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Clear all items
                    items.forEach((item) => removeItem(item.id));
                  }}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Heart className="h-24 w-24 mx-auto" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                Your wishlist is empty
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start adding items you love to your wishlist. They'll be saved
                here for easy access later.
              </p>
              <Link href="/products">
                <Button className="townkart-gradient hover:opacity-90">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {items.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <Link href={`/products/${product.id}`}>
                        <ImageWithFallback
                          src={product.image}
                          fallbackSrc={getDefaultImage("product")}
                          alt={product.name}
                          width={300}
                          height={200}
                          className="object-cover w-full h-48"
                        />
                      </Link>

                      {/* Remove from wishlist */}
                      <div className="absolute top-3 right-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="p-2 bg-white/90 hover:bg-white shadow-lg"
                          onClick={() => handleRemoveFromWishlist(product.id)}
                        >
                          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                        </Button>
                      </div>

                      {/* Quick Actions */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="p-2">
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <Link href={`/products/${product.id}`}>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-townkart-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <span className="font-medium">{product.shop}</span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{product.price}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className={`flex-1 townkart-gradient hover:opacity-90 font-medium text-sm py-2 relative ${isAnimating ? "animate-pulse" : ""}`}
                            size="sm"
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Add to Cart
                            {isAnimating && (
                              <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded animate-ping"></div>
                            )}
                          </Button>
                          <Link href={`/products/${product.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-3"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
