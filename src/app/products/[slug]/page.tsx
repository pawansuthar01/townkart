"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Star,
  MapPin,
  Clock,
  Truck,
  Shield,
  Heart,
  Share2,
  Minus,
  Plus,
  ShoppingCart,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  Loader2,
  Gift,
  Percent,
  Tag,
  Copy,
  Check,
  Package,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
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
    rating?: number;
    distance?: string;
    deliveryTime?: string;
    isVerified?: boolean;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  variants?: any[];
  reviews?: any[];
  features?: string[];
  specifications?: any;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  nutritionalInfo?: any;
  relatedProducts?: string[];
  stock?: number;
  shop?: any;
}

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user, isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<any[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (product?.id) {
      fetchAvailableOffers();
    }
  }, [product?.id, user?.id]);

  const fetchAvailableOffers = async () => {
    if (!product?.id) return;

    try {
      const params = new URLSearchParams();
      if (user?.id) params.set("userId", user.id);
      params.set("productId", product.id);

      const response = await fetch(`/api/offers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableOffers(data.offers || []);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the slug API endpoint
      const response = await fetch(
        `/api/products/slug/${encodeURIComponent(slug)}`
      );
      const data = await response.json();

      if (data.success) {
        setProduct(data.data);
      } else {
        setError("Product not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      image: product.primaryImage || product.images?.[0] || "",
      quantity: quantity,
      shop: product.store?.name || "Unknown Shop",
      stock: product.stockQuantity,
    });
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleToggleWishlist = () => {
    if (!product) return;

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

  const handleReviewSubmit = async () => {
    if (!isAuthenticated) {
      window.location.href = "/auth/login";
      return;
    }

    if (!product) return;

    try {
      setSubmittingReview(true);
      // TODO: Implement review submission API
      console.log("Review submitted:", {
        productId: product.id,
        rating: reviewRating,
        text: reviewText,
      });
      setReviewText("");
      setReviewRating(5);
      // Refresh product data to show new review
      await fetchProduct();
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb Skeleton */}
            <div className="bg-white border-b mb-8">
              <div className="py-3">
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Image Skeleton */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>

              {/* Content Skeleton */}
              <div className="space-y-6">
                <div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 bg-gray-200 rounded animate-pulse"
                        ></div>
                      ))}
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>

                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                      <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>

                  <div className="flex space-x-3">
                    <div className="h-12 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {error || "Product Not Found"}
            </h1>
            <p className="text-gray-600 mb-8">
              {error
                ? "Failed to load product details."
                : "The product you're looking for doesn't exist."}
            </p>
            <Link href="/products">
              <Button className="townkart-gradient">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="w-full px-4 py-3">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-townkart-primary">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/categories" className="hover:text-townkart-primary">
              Categories
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/categories/${product.categoryName}`}
              className="hover:text-townkart-primary capitalize"
            >
              {product.categoryName}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container-max py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Product Images */}
          <div className="space-y-6">
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg group">
              <ImageWithFallback
                src={
                  product.images?.[selectedImage] || product.primaryImage || ""
                }
                fallbackSrc={getDefaultImage("product")}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              {product.discountedPrice &&
                product.discountedPrice < product.price && (
                  <Badge className="absolute top-6 left-6 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-3 py-1 shadow-lg animate-pulse">
                    {Math.round(
                      ((product.price - product.discountedPrice) /
                        product.price) *
                        100
                    )}
                    % OFF
                  </Badge>
                )}
              {product.isNew && (
                <Badge className="absolute top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-3 py-1 shadow-lg">
                  New
                </Badge>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-3 transition-all duration-300 hover:shadow-lg ${
                      selectedImage === index
                        ? "border-townkart-primary ring-2 ring-townkart-primary/20 scale-105"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <ImageWithFallback
                      src={image}
                      fallbackSrc={getDefaultImage("product")}
                      alt={`${product.name} ${index + 1}`}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center bg-yellow-50 px-3 py-2 rounded-full">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(product.averageRating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-yellow-200"
                      }`}
                    />
                  ))}
                  <span className="ml-3 text-gray-700 font-semibold">
                    {product.averageRating?.toFixed(1) || "0.0"}
                  </span>
                  <span className="ml-2 text-gray-600">
                    ({product.totalReviews || 0} reviews)
                  </span>
                </div>
                {product.isAvailable && (
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    In Stock
                  </Badge>
                )}
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
                  <span className="text-4xl lg:text-5xl font-bold text-gray-900">
                    ₹{discountedPrice || product.price}
                  </span>
                  {(product.originalPrice || discountedPrice) && (
                    <span className="text-xl text-gray-500 line-through">
                      ₹{product.originalPrice || product.price}
                    </span>
                  )}
                </div>
                {(product.discount || discountedPrice) && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 text-sm font-bold shadow-lg">
                    Save ₹
                    {(product.originalPrice || product.price) -
                      (discountedPrice || product.price)}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-3 flex items-center">
                <Truck className="h-4 w-4 mr-2 text-green-600" />
                Free delivery on orders above ₹500
              </p>
            </div>

            {/* Offers & Coupons */}
            {availableOffers.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-600" />
                  Available Offers
                </h3>

                <div className="space-y-3">
                  {availableOffers.slice(0, 3).map((offer) => (
                    <Card
                      key={offer.id}
                      className="border-green-200 bg-green-50"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Percent className="h-4 w-4 text-green-600" />
                              <span className="font-semibold text-green-800">
                                {offer.title}
                              </span>
                            </div>
                            <p className="text-sm text-green-700 mb-2">
                              {offer.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-green-600">
                              <span>Min. order: ₹{offer.minOrderValue}</span>
                              {offer.maxDiscount && (
                                <span>Max. discount: ₹{offer.maxDiscount}</span>
                              )}
                            </div>
                          </div>
                          {offer.couponCode && (
                            <div className="flex items-center gap-2">
                              <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                                {offer.couponCode}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    offer.couponCode
                                  );
                                  // Show toast or feedback
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Coupon Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Apply coupon logic
                      if (couponCode) {
                        setAppliedCoupon(couponCode);
                        // Calculate discount (mock)
                        const discount = Math.min(product.price * 0.1, 100); // 10% or max ₹100
                        setDiscountedPrice(product.price - discount);
                        setCouponCode("");
                      }
                    }}
                    disabled={!couponCode}
                  >
                    Apply
                  </Button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Coupon {appliedCoupon} applied successfully!
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Shop Info */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {product.shop.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span>{product.shop.rating}</span>
                      <span className="mx-2">•</span>
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{product.shop.distance}</span>
                      <span className="mx-2">•</span>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{product.shop.deliveryTime}</span>
                    </div>
                  </div>
                </div>
                {product.shop.isVerified && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </Card>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Select Variant
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {product.variants.map((variant, index) => (
                    <button
                      key={index}
                      className="p-3 border border-gray-200 rounded-lg text-left hover:border-townkart-primary transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{variant.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold">₹{variant.price}</span>
                          {variant.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{variant.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="px-6 py-3 font-bold text-lg min-w-[3rem] text-center bg-gray-50">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity >= (product.stock || 0)}
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <Package className="h-4 w-4 mr-2 text-blue-600" />
                    {product.stock || 0} available
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={handleAddToCart}
                  className="townkart-gradient hover:opacity-90 font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="py-4 border-2 hover:border-townkart-primary hover:bg-townkart-primary/5 transition-all duration-300"
                  onClick={handleToggleWishlist}
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      isInWishlist(product.id)
                        ? "fill-red-500 text-red-500"
                        : "text-gray-600 hover:text-red-500"
                    }`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="py-4 border-2 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.name,
                        text: product.description,
                        url: window.location.href,
                      });
                    }
                  }}
                >
                  <Share2 className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            </div>

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Key Features
                </h3>
                <ul className="grid grid-cols-2 gap-2">
                  {product.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {["description", "nutrition", "reviews"].map((tab) => (
                <button
                  key={tab}
                  className="py-4 px-1 border-b-2 font-medium text-sm capitalize"
                  style={{
                    borderColor:
                      tab === "description" ? "#f97316" : "transparent",
                    color: tab === "description" ? "#f97316" : "#6b7280",
                  }}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {/* Description */}
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Product Description
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Nutrition Info */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nutritional Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {product.nutritionalInfo &&
                  Object.entries(product.nutritionalInfo).map(
                    ([key, value]) => (
                      <div key={key} className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {String(value)}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {key}
                        </div>
                      </div>
                    )
                  )}
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Reviews ({product.reviews?.length || 0})
                </h3>
                <div className="flex items-center">
                  <div className="flex items-center mr-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 font-medium">
                      {product.rating || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Write Review */}
              {isAuthenticated && (
                <Card className="p-6 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    Write a Review
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating
                      </label>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                star <= reviewRating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Review
                      </label>
                      <Textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your experience with this product..."
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={handleReviewSubmit}
                      className="townkart-gradient"
                    >
                      Submit Review
                    </Button>
                  </div>
                </Card>
              )}

              {/* Reviews List */}
              <div className="space-y-6">
                {product.reviews &&
                  product.reviews.length > 0 &&
                  product.reviews.map((review) => (
                    <Card key={review.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {review.user.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {review.user}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {review.date}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3">{review.comment}</p>
                          <div className="flex items-center space-x-4">
                            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
                              <ThumbsUp className="h-4 w-4" />
                              <span>Helpful ({review.helpful})</span>
                            </button>
                            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
                              <MessageSquare className="h-4 w-4" />
                              <span>Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {product.relatedProducts.slice(0, 3).map((relatedId, index) => (
                <Link key={relatedId || index} href={`/products/${relatedId}`}>
                  <Card className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="relative">
                        <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                          <span className="text-gray-500">Related Product</span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-townkart-primary transition-colors">
                            Related Product {index + 1}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">₹0</span>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm">0.0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
