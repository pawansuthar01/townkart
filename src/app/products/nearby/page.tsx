"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Navigation,
  Clock,
  Star,
  ShoppingCart,
  Heart,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Truck,
  Package,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";
import {
  ImageWithFallback,
  getDefaultImage,
} from "@/components/shared/ImageWithFallback";

interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  discountedPrice?: number;
  stockQuantity: number;
  categoryName: string;
  subcategory?: string;
  brand?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  averageRating?: number;
  totalReviews?: number;
  totalSales?: number;
  primaryImage?: string;
  images?: string[];
  store?: {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    averageRating?: number;
    distance?: string;
    deliveryTime?: string;
    isVerified?: boolean;
  };
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export default function ProductNearbyPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [maxDistance, setMaxDistance] = useState(5); // km
  const [categories, setCategories] = useState<any[]>([]);

  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();

  // Get user location
  const getUserLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          resolve(locationData);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  // Calculate distance between two points
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch products with location filtering
  const fetchNearbyProducts = async (location?: LocationData) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "50",
        sortBy: "distance",
      });

      if (searchQuery) params.set("query", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (location) {
        params.set("latitude", location.latitude.toString());
        params.set("longitude", location.longitude.toString());
        params.set("maxDistance", maxDistance.toString());
      }

      const response = await fetch(`/api/products/nearby?${params}`);
      const data = await response.json();

      if (data.success) {
        // Add distance calculation for each product
        const productsWithDistance = data.data.map((product: Product) => {
          if (location && product.store?.latitude && product.store?.longitude) {
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              product.store.latitude,
              product.store.longitude
            );
            return {
              ...product,
              store: {
                ...product.store,
                distance: `${distance.toFixed(1)} km`,
              },
            };
          }
          return product;
        });

        setProducts(productsWithDistance);
      } else {
        setError(data.message || "Failed to fetch nearby products");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch nearby products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Initialize location and data
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        setLocationLoading(true);
        const location = await getUserLocation();
        setUserLocation(location);
        setLocationError(null);
        await fetchNearbyProducts(location);
      } catch (err: any) {
        setLocationError(err.message);
        // Try to fetch products without location
        await fetchNearbyProducts();
      } finally {
        setLocationLoading(false);
      }
    };

    fetchCategories();
    initializeLocation();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if (!locationLoading) {
      fetchNearbyProducts(userLocation || undefined);
    }
  }, [searchQuery, selectedCategory, maxDistance]);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      image: product.primaryImage || product.images?.[0] || "",
      quantity: 1,
      shop: product.store?.name || "Unknown Shop",
      stock: product.stockQuantity,
    });
  };

  const handleToggleWishlist = (product: Product) => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      image: product.primaryImage || product.images?.[0] || "",
      shop: product.store?.name || "Unknown Shop",
      category: product.categoryName,
      description: product.description || "",
    });
  };

  const getDeliveryTime = (category: string) => {
    const times: { [key: string]: string } = {
      Grocery: "30 mins",
      Food: "45 mins",
      Medicine: "20 mins",
      Electronics: "1-2 hours",
      Fashion: "1 hour",
      Household: "50 mins",
    };
    return times[category] || "45 mins";
  };

  const refreshLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      const location = await getUserLocation();
      setUserLocation(location);
      await fetchNearbyProducts(location);
    } catch (err: any) {
      setLocationError(err.message);
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-16">
        <div className="container-max">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                <MapPin className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Products Near You
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Discover amazing products from stores in your neighborhood with
              ultra-fast delivery
            </p>

            {/* Location Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
              {locationLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Detecting your location...</span>
                </div>
              ) : locationError ? (
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-300" />
                  <p className="text-yellow-200 mb-3">
                    Location access needed for nearby products
                  </p>
                  <Button
                    onClick={refreshLocation}
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : userLocation ? (
                <div className="flex items-center justify-center space-x-3">
                  <Navigation className="h-5 w-5 text-green-300" />
                  <span className="text-green-200">
                    Location detected • Finding nearby products...
                  </span>
                </div>
              ) : null}
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
                <Input
                  type="text"
                  placeholder="Search products near you..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-6 py-4 text-lg bg-white/95 text-gray-900 border-0 rounded-2xl shadow-2xl backdrop-blur-sm placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Controls */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Categories */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === ""
                    ? "bg-townkart-primary text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                }`}
              >
                All Nearby
              </button>
              {categories.slice(0, 6).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === category.name
                      ? "bg-townkart-primary text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Distance Filter */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Distance:
                </span>
                <select
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-townkart-primary"
                >
                  <option value={1}>1 km</option>
                  <option value={2}>2 km</option>
                  <option value={3}>3 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container mx-auto px-4 py-12">
        {error ? (
          <div className="text-center py-16">
            <div className="text-red-500 mb-4">
              <AlertCircle className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to load nearby products
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => fetchNearbyProducts(userLocation || undefined)}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        ) : products.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Package className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found nearby
            </h3>
            <p className="text-gray-600 mb-6">
              Try increasing your search distance or searching for different
              products
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => setMaxDistance(Math.min(maxDistance + 5, 50))}
                variant="outline"
              >
                Increase Distance
              </Button>
              <Button onClick={() => setSelectedCategory("")} variant="outline">
                Show All Categories
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {selectedCategory
                    ? `${selectedCategory} Near You`
                    : "Products Near You"}
                </h2>
                <p className="text-gray-600">
                  {products.length} amazing products within {maxDistance}km
                  {userLocation && (
                    <span className="text-green-600 font-medium">
                      {" "}
                      • Location detected
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={refreshLocation}
                variant="outline"
                disabled={locationLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${locationLoading ? "animate-spin" : ""}`}
                />
                Refresh Location
              </Button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white overflow-hidden hover:-translate-y-2"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <Link href={`/products/${product.slug || product.id}`}>
                        <div className="relative aspect-square overflow-hidden">
                          <ImageWithFallback
                            src={
                              product.primaryImage || product.images?.[0] || ""
                            }
                            fallbackSrc={getDefaultImage("product")}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />

                          {/* Distance Badge */}
                          {product.store?.distance && (
                            <div className="absolute top-3 left-3">
                              <Badge className="bg-blue-500 text-white font-bold shadow-lg">
                                <MapPin className="h-3 w-3 mr-1" />
                                {product.store.distance}
                              </Badge>
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-3 right-3 flex flex-col gap-2">
                            {product.discountedPrice && (
                              <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-lg">
                                {Math.round(
                                  ((product.price - product.discountedPrice) /
                                    product.price) *
                                    100
                                )}
                                % OFF
                              </Badge>
                            )}
                            {product.isNew && (
                              <Badge className="bg-green-500 text-white text-xs shadow-lg">
                                New
                              </Badge>
                            )}
                          </div>

                          {/* Rating */}
                          {product.averageRating && (
                            <div className="absolute bottom-3 left-3">
                              <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                <span className="text-xs font-bold text-gray-900">
                                  {product.averageRating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="p-2 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleToggleWishlist(product);
                              }}
                            >
                              <Heart
                                className={`h-3 w-3 ${
                                  isInWishlist(product.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-600"
                                }`}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="p-2 bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
                            >
                              <Eye className="h-3 w-3 text-gray-600" />
                            </Button>
                          </div>
                        </div>
                      </Link>

                      {/* Product Info */}
                      <div className="p-4">
                        <Link href={`/products/${product.slug || product.id}`}>
                          <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-townkart-primary transition-colors text-sm leading-tight">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Store & Location Info */}
                        <div className="flex items-center text-xs text-gray-600 mb-3 gap-2">
                          <span className="font-medium truncate">
                            {product.store?.name || "Unknown Store"}
                          </span>
                          {product.store?.isVerified && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1 py-0"
                            >
                              ✓ Verified
                            </Badge>
                          )}
                        </div>

                        {/* Delivery Time */}
                        <div className="flex items-center text-xs text-gray-600 mb-3">
                          <Truck className="h-3 w-3 mr-1 text-green-600" />
                          <span>{getDeliveryTime(product.categoryName)}</span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              ₹{product.discountedPrice || product.price}
                            </span>
                            {product.discountedPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{product.price}
                              </span>
                            )}
                          </div>
                          {product.totalSales && product.totalSales > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {product.totalSales} sold
                            </Badge>
                          )}
                        </div>

                        {/* Add to Cart */}
                        <Button
                          onClick={() => handleAddToCart(product)}
                          className="w-full townkart-gradient hover:opacity-90 font-medium text-sm py-2.5 shadow-lg hover:shadow-xl transition-all duration-300"
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

            {/* Load More */}
            {products.length >= 50 && (
              <div className="text-center">
                <Button variant="outline" size="lg" className="px-8">
                  Load More Products
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
