"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  ShoppingCart,
  Star,
  MapPin,
  Clock,
  Heart,
  Share2,
  Truck,
  Shield,
  Award,
  Users,
  MessageCircle,
  ThumbsUp,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface ProductDetailPageProps {
  params: {
    productId: string;
  };
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCart();

  // Mock product data - in real app, fetch based on productId
  const product = {
    id: parseInt(params.productId),
    name: "Premium Wireless Headphones",
    price: 2499,
    originalPrice: 2999,
    discount: 17,
    rating: 4.6,
    reviews: 203,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1524678714210-9917a6c619c2?w=600&h=600&fit=crop",
    ],
    shop: {
      name: "TechHub Electronics",
      rating: 4.8,
      totalProducts: 156,
      joinedDate: "2022-03-15",
      distance: "2.1 km",
      deliveryTime: "1-2 hours",
      isVerified: true,
    },
    category: "Electronics",
    stock: 8,
    description:
      "Experience premium sound quality with our wireless headphones featuring active noise cancellation, 30-hour battery life, and premium comfort. Perfect for music lovers and professionals alike.",
    features: [
      "Active Noise Cancellation",
      "30-hour battery life",
      "Premium leather cushions",
      "Bluetooth 5.0 connectivity",
      "Touch controls",
      "Voice assistant compatible",
      "Foldable design",
      "Carrying case included",
    ],
    specifications: {
      "Driver Size": "40mm",
      "Frequency Response": "20Hz - 20kHz",
      Impedance: "32Ω",
      "Battery Life": "30 hours",
      "Charging Time": "2 hours",
      Weight: "250g",
      Connectivity: "Bluetooth 5.0",
      Warranty: "1 year",
    },
    customerReviews: [
      {
        id: 1,
        user: "Rahul Sharma",
        rating: 5,
        date: "2024-01-15",
        comment:
          "Excellent sound quality and battery life. Very comfortable for long listening sessions.",
        helpful: 12,
        verified: true,
      },
      {
        id: 2,
        user: "Priya Patel",
        rating: 4,
        date: "2024-01-10",
        comment:
          "Good headphones, noise cancellation works well. Only minor issue with touch controls.",
        helpful: 8,
        verified: true,
      },
      {
        id: 3,
        user: "Amit Kumar",
        rating: 5,
        date: "2024-01-08",
        comment: "Best wireless headphones I've owned. Worth every penny!",
        helpful: 15,
        verified: true,
      },
    ],
    relatedProducts: [
      {
        id: 7,
        name: "Smart Watch",
        price: 5999,
        rating: 4.6,
        image:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop",
      },
      {
        id: 9,
        name: "LED Desk Lamp",
        price: 1299,
        rating: 4.5,
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
      },
      {
        id: 11,
        name: "Notebook Set",
        price: 199,
        rating: 4.6,
        image:
          "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300&h=200&fit=crop",
      },
    ],
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: quantity,
      shop: product.shop.name,
      stock: product.stock,
    });
  };

  const handleQuantityChange = (change: number) => {
    setQuantity((prev) => Math.max(1, Math.min(product.stock, prev + change)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <section className="py-4 px-4 bg-white border-b">
        <div className="w-full">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-townkart-primary">
              Home
            </Link>
            <span>/</span>
            <Link href="/products" className="hover:text-townkart-primary">
              Products
            </Link>
            <span>/</span>
            <Link
              href={`/categories/${product.category.toLowerCase()}`}
              className="hover:text-townkart-primary"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Product Details */}
      <section className="py-8 px-4">
        <div className="w-full">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />

                {/* Image Navigation */}
                <button
                  onClick={() =>
                    setSelectedImage((prev) =>
                      prev > 0 ? prev - 1 : product.images.length - 1,
                    )
                  }
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setSelectedImage((prev) =>
                      prev < product.images.length - 1 ? prev + 1 : 0,
                    )
                  }
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.discount && (
                    <Badge className="bg-red-500 text-white font-bold">
                      {product.discount}% OFF
                    </Badge>
                  )}
                  <Badge className="bg-green-500 text-white">
                    In Stock ({product.stock})
                  </Badge>
                </div>
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-townkart-primary"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title and Rating */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {product.name}
                </h1>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-lg font-semibold">
                      {product.rating}
                    </span>
                    <span className="ml-1 text-gray-600">
                      ({product.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4">
                <span className="text-4xl font-bold text-gray-900">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-2xl text-gray-500 line-through">
                      ₹{product.originalPrice}
                    </span>
                    <Badge className="bg-green-500 text-white">
                      Save ₹{product.originalPrice - product.price}
                    </Badge>
                  </>
                )}
              </div>

              {/* Shop Info */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-townkart-primary rounded-full flex items-center justify-center">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {product.shop.name}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span>{product.shop.rating}</span>
                          <span className="mx-2">•</span>
                          <span>{product.shop.totalProducts} products</span>
                        </div>
                      </div>
                    </div>
                    {product.shop.isVerified && (
                      <Badge className="bg-green-500 text-white">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{product.shop.distance}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{product.shop.deliveryTime}</span>
                    </div>
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      <span>Free delivery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quantity and Add to Cart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Quantity:</span>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-semibold w-12 text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 bg-gradient-to-r from-townkart-primary to-townkart-secondary hover:from-townkart-primary/90 hover:to-townkart-secondary/90 text-white font-semibold py-3"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart - ₹{product.price * quantity}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsWishlisted(!isWishlisted)}
                    className={`p-3 ${isWishlisted ? "text-red-500 border-red-500" : ""}`}
                  >
                    <Heart
                      className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`}
                    />
                  </Button>
                  <Button variant="outline" className="p-3">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Key Features */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.features.slice(0, 6).map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <div className="w-2 h-2 bg-townkart-primary rounded-full mr-2"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Description & Specifications */}
      <section className="py-8 px-4 bg-white">
        <div className="w-full">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Description */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                {product.description}
              </p>

              <h3 className="text-xl font-semibold mb-4">All Features</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {product.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <Award className="h-5 w-5 text-townkart-primary mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Specifications</h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {Object.entries(product.specifications).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-gray-600 font-medium">
                            {key}:
                          </span>
                          <span className="text-gray-900">{value}</span>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-8 px-4">
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Customer Reviews</h2>
            <Button variant="outline">Write a Review</Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {product.customerReviews.map((review) => (
              <Card key={review.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-townkart-primary rounded-full flex items-center justify-center text-white font-semibold">
                        {review.user.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{review.user}</span>
                          {review.verified && (
                            <Badge className="bg-green-500 text-white text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-gray-500 ml-2">
                            {review.date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{review.comment}</p>

                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful ({review.helpful})
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-6">
            <Button variant="outline">Load More Reviews</Button>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-8 px-4 bg-gray-50">
        <div className="w-full">
          <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {product.relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                href={`/products/${relatedProduct.id}`}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 border-0">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div
                        className="h-48 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${relatedProduct.image})`,
                        }}
                      />
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-xs font-semibold">
                            {relatedProduct.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-townkart-primary transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{relatedProduct.price}
                        </span>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
