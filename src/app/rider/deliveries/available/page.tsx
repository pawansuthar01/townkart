"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Clock,
  DollarSign,
  Package,
  Navigation,
  Phone,
  CheckCircle,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AvailableDelivery {
  id: string;
  orderId: string;
  deliveryFee: number;
  distanceKm: number;
  estimatedTime: number; // in minutes
  order: {
    orderNumber: string;
    totalAmount: number;
    customer: {
      fullName: string;
      phoneNumber?: string;
    };
    merchant: {
      businessName: string;
      address: string;
      latitude: number;
      longitude: number;
    };
    orderItems: any[];
    deliveryAddress: any;
    createdAt: string;
  };
}

export default function AvailableDeliveriesPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<AvailableDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingDelivery, setAcceptingDelivery] = useState<string | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"distance" | "fee" | "time">("distance");
  const [riderLocation, setRiderLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    fetchRiderLocation();
    fetchAvailableDeliveries();
  }, []);

  const fetchRiderLocation = async () => {
    try {
      const response = await fetch("/api/riders/location");
      const data = await response.json();
      if (data.success && data.data.location) {
        setRiderLocation({
          latitude: data.data.location.latitude,
          longitude: data.data.location.longitude,
        });
      }
    } catch (error) {
      console.error("Failed to fetch rider location:", error);
    }
  };

  const fetchAvailableDeliveries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (riderLocation) {
        params.append("latitude", riderLocation.latitude.toString());
        params.append("longitude", riderLocation.longitude.toString());
      }

      const response = await fetch(`/api/deliveries/available?${params}`);
      const data = await response.json();

      if (data.success) {
        setDeliveries(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch available deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedDeliveries = [...deliveries].sort((a, b) => {
    switch (sortBy) {
      case "distance":
        return a.distanceKm - b.distanceKm;
      case "fee":
        return b.deliveryFee - a.deliveryFee;
      case "time":
        return a.estimatedTime - b.estimatedTime;
      default:
        return 0;
    }
  });

  const filteredDeliveries = sortedDeliveries.filter((delivery) => {
    const matchesSearch =
      delivery.order.orderNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      delivery.order.customer.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      delivery.order.merchant.businessName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleAcceptDelivery = async (deliveryId: string) => {
    setAcceptingDelivery(deliveryId);
    try {
      const response = await fetch("/api/deliveries/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: deliveryId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Remove the delivery from available list
        setDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));
        alert("Delivery accepted successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to accept delivery. Please try again.");
      }
    } catch (error) {
      console.error("Error accepting delivery:", error);
      alert("Failed to accept delivery. Please try again.");
    } finally {
      setAcceptingDelivery(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffInMinutes = Math.floor(
      (now.getTime() - orderTime.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes === 1) return "1 minute ago";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Available Deliveries
              </h1>
              <p className="text-gray-600 mt-1">
                Browse and accept new delivery opportunities
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {filteredDeliveries.length} Available
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by order number, customer, or merchant..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "distance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("distance")}
                >
                  Nearest
                </Button>
                <Button
                  variant={sortBy === "fee" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("fee")}
                >
                  Highest Pay
                </Button>
                <Button
                  variant={sortBy === "time" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("time")}
                >
                  Quickest
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliveries List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading available deliveries...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => (
              <Card
                key={delivery.id}
                className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{delivery.order.orderNumber}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-600"
                          >
                            {getTimeAgo(delivery.order.createdAt)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            ₹{delivery.deliveryFee}
                          </div>
                          <div className="text-sm text-gray-600">Earnings</div>
                        </div>
                      </div>

                      {/* Delivery Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        {/* Pickup */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm font-medium text-gray-700">
                            <Package className="h-4 w-4 mr-2 text-blue-500" />
                            Pickup Location
                          </div>
                          <div className="pl-6 space-y-1">
                            <p className="text-sm font-medium text-gray-900">
                              {delivery.order.merchant.businessName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {delivery.order.merchant.address}
                            </p>
                          </div>
                        </div>

                        {/* Delivery */}
                        <div className="space-y-2">
                          <div className="flex items-center text-sm font-medium text-gray-700">
                            <MapPin className="h-4 w-4 mr-2 text-red-500" />
                            Delivery Location
                          </div>
                          <div className="pl-6 space-y-1">
                            <p className="text-sm font-medium text-gray-900">
                              {delivery.order.customer.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {delivery.order.deliveryAddress.line1},{" "}
                              {delivery.order.deliveryAddress.city}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-4">
                          <span>
                            <Package className="h-4 w-4 inline mr-1" />
                            {delivery.order.orderItems.length} items
                          </span>
                          <span>
                            <Navigation className="h-4 w-4 inline mr-1" />
                            {delivery.distanceKm} km away
                          </span>
                          <span>
                            <Clock className="h-4 w-4 inline mr-1" />~
                            {delivery.estimatedTime} min
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Order value: ₹{delivery.order.totalAmount}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 mt-6 lg:mt-0 lg:ml-6">
                      <Button
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => handleAcceptDelivery(delivery.id)}
                        disabled={acceptingDelivery === delivery.id}
                      >
                        {acceptingDelivery === delivery.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept Delivery
                          </>
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        View on Map
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredDeliveries.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No available deliveries
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? "No deliveries match your search criteria."
                    : "There are no deliveries available in your area right now. Check back soon!"}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
