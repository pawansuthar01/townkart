"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  ShoppingCart,
  Heart,
  Share2,
  CheckCircle,
  Store,
  Package,
  Users,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface StoreDetails {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  category: string;
  subcategory: string;
  phoneNumber: string;
  email: string;
  operatingHours: any;
  averageRating: string;
  totalReviews: number;
  totalOrders: number;
  totalProducts: number;
  isOpen: boolean;
  products: Array<{
    id: string;
    name: string;
    price: number;
    discountedPrice: number;
    images: any;
    description: string;
    category: string;
    slug: string;
  }>;
  offers: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    discountValue: number;
    minOrderValue: number;
    couponCode: string;
    endDate: string;
  }>;
  reviews: Array<{
    id: string;
    storeRating: number;
    riderRating: number;
    comment: string;
    createdAt: string;
    customer: {
      id: string;
      fullName: string;
    };
  }>;
  createdAt: string;
}

interface StorePageProps {
  params: {
    id: string;
  };
}

export default function StoreDetailsPage({ params }: StorePageProps) {
  const [store, setStore] = useState<StoreDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    fetchStoreDetails();
  }, [params.id]);

  const fetchStoreDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shops/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch store details");
      }
      const data = await response.json();
      if (data.success) {
        setStore(data.data);
      } else {
        setError(data.message || "Store not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load store details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: StoreDetails["products"][0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.discountedPrice || product.price,
      image:
        product.images?.[0]?.url ||
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
      quantity: 1,
      shop: store?.name || "Store",
      stock: 10,
    });
  };

  const formatOperatingHours = (hours: any) => {
    if (!hours) return "Hours not specified";

    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayNames = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    return days
      .map((day, index) => {
        const dayHours = hours[day];
        if (!dayHours || !dayHours.open || !dayHours.close) {
          return `${dayNames[index]}: Closed`;
        }
        return `${dayNames[index]}: ${dayHours.open} - ${dayHours.close}`;
      })
      .join("\n");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading store details...</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Store Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error || "The store you're looking for doesn't exist."}
            </p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Store Header */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Store Image */}
            <div className="lg:w-1/3">
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop"
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Store Info */}
            <div className="lg:w-2/3">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {store.name}
                  </h1>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">
                        {store.averageRating}
                      </span>
                      <span className="text-gray-600">
                        ({store.totalReviews} reviews)
                      </span>
                    </div>
                    <Badge variant={store.isOpen ? "default" : "secondary"}>
                      {store.isOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{store.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    Favorite
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Contact & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Address</p>
                    <p className="text-gray-600 text-sm">
                      {store.address}, {store.city}, {store.state}{" "}
                      {store.pincode}
                    </p>
                  </div>
                </div>
                {store.phoneNumber && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <p className="text-gray-600 text-sm">
                        {store.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {store.totalOrders}
                  </div>
                  <div className="text-sm text-gray-600">Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {store.totalProducts}
                  </div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {store.totalReviews}
                  </div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Store Offers */}
      {store.offers.length > 0 && (
        <section className="py-8 px-4 bg-red-50">
          <div className="container mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Special Offers
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.offers.map((offer) => (
                <Card key={offer.id} className="border-red-200 bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {offer.title}
                      </h3>
                      <Badge className="bg-red-500 text-white">
                        {offer.discountValue}% OFF
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {offer.description}
                    </p>
                    {offer.couponCode && (
                      <Badge variant="outline" className="text-xs">
                        Code: {offer.couponCode}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Products</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {store.products.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-200 rounded-t-lg overflow-hidden">
                  <img
                    src={
                      product.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=300&fit=crop"
                    }
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
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
                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {store.products.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products available
              </h3>
              <p className="text-gray-600">
                This store doesn't have any products listed at the moment.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Customer Reviews
          </h2>

          {store.reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {store.reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < (review.storeRating || 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {review.storeRating}/5
                          </span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {review.customer.fullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700">{review.comment}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-600">
                Be the first to review this store!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Operating Hours */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line text-gray-700">
                {formatOperatingHours(store.operatingHours)}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
