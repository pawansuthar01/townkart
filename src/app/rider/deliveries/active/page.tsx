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
  XCircle,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch, useSelector } from "react-redux";
import { fetchDeliveries } from "@/store/slices/deliverySlice";
import { RootState, AppDispatch } from "@/store";

interface Delivery {
  id: string;
  orderId: string;
  deliveryStatus: string;
  pickupTime?: string;
  deliveryTime?: string;
  deliveryFee: number;
  distanceKm: number;
  order: {
    orderNumber: string;
    customer: {
      fullName: string;
      phoneNumber?: string;
    };
    merchant: {
      businessName: string;
      address: string;
    };
    orderItems: any[];
    deliveryAddress?: any;
  };
}

export default function ActiveDeliveriesPage() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { deliveries, loading } = useSelector(
    (state: RootState) => state.delivery,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchDeliveries(user.id));
    }
  }, [dispatch, user?.id]);

  const activeDeliveries = deliveries.filter(
    (d) => d.deliveryStatus !== "DELIVERED",
  );

  const filteredDeliveries = activeDeliveries.filter((delivery) => {
    const matchesSearch =
      delivery.order?.orderNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      delivery.order?.customer.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      delivery.order?.merchant.businessName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || delivery.deliveryStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-500";
      case "PICKED_UP":
        return "bg-yellow-500";
      case "OUT_FOR_DELIVERY":
        return "bg-orange-500";
      case "DELIVERED":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "Assigned";
      case "PICKED_UP":
        return "Picked Up";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";
      case "DELIVERED":
        return "Delivered";
      default:
        return status;
    }
  };

  const handleAcceptDelivery = async (deliveryId: string) => {
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
        alert("Delivery accepted successfully!");
        // Refresh deliveries
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to accept delivery");
      }
    } catch (error) {
      console.error("Error accepting delivery:", error);
      alert("Failed to accept delivery");
    }
  };

  const handlePickupOrder = async (deliveryId: string) => {
    const pickupOtp = prompt("Enter pickup OTP:");
    if (!pickupOtp) return;

    try {
      const response = await fetch("/api/deliveries/pickup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryId, pickupOtp }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Order picked up successfully!");
        // Refresh deliveries
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to pickup order");
      }
    } catch (error) {
      console.error("Error picking up order:", error);
      alert("Failed to pickup order");
    }
  };

  const handleDeliverOrder = async (deliveryId: string) => {
    const deliveryOtp = prompt("Enter delivery OTP:");
    if (!deliveryOtp) return;

    try {
      const response = await fetch("/api/deliveries/deliver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryId, deliveryOtp }),
      });

      if (response.ok) {
        const data = await response.json();
        alert("Order delivered successfully!");
        // Refresh deliveries
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to deliver order");
      }
    } catch (error) {
      console.error("Error delivering order:", error);
      alert("Failed to deliver order");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Active Deliveries
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your ongoing delivery tasks
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {activeDeliveries.length} Active
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
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
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "ASSIGNED" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("ASSIGNED")}
                >
                  Assigned
                </Button>
                <Button
                  variant={statusFilter === "PICKED_UP" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("PICKED_UP")}
                >
                  Picked Up
                </Button>
                <Button
                  variant={
                    statusFilter === "OUT_FOR_DELIVERY" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setStatusFilter("OUT_FOR_DELIVERY")}
                >
                  Out for Delivery
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliveries List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deliveries...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => (
              <Card
                key={delivery.id}
                className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{delivery.order?.orderNumber}
                          </h3>
                          <Badge
                            className={`${getStatusColor(delivery.deliveryStatus)} text-white`}
                          >
                            {getStatusText(delivery.deliveryStatus)}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
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
                              {delivery.order?.merchant.businessName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {delivery.order?.merchant.address}
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
                              {delivery.order?.customer.fullName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {typeof delivery.order?.deliveryAddress ===
                                "object" &&
                              delivery.order.deliveryAddress &&
                              "line1" in delivery.order.deliveryAddress
                                ? `${(delivery.order.deliveryAddress as any).line1}, ${(delivery.order.deliveryAddress as any).city}`
                                : "Address not available"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Order Details */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-4">
                          <span>
                            <Package className="h-4 w-4 inline mr-1" />
                            {delivery.order?.orderItems.length} items
                          </span>
                          <span>
                            <Navigation className="h-4 w-4 inline mr-1" />
                            {delivery.distanceKm} km away
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {delivery.order?.customer.phoneNumber && (
                            <Button variant="outline" size="sm">
                              <Phone className="h-4 w-4 mr-1" />
                              Call Customer
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="flex items-center space-x-6 text-xs text-gray-500">
                        {delivery.pickupTime && (
                          <span>
                            Picked up:{" "}
                            {new Date(delivery.pickupTime).toLocaleTimeString()}
                          </span>
                        )}
                        {delivery.deliveryTime && (
                          <span>
                            Delivered:{" "}
                            {new Date(
                              delivery.deliveryTime,
                            ).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 mt-6 lg:mt-0 lg:ml-6">
                      {delivery.deliveryStatus === "ASSIGNED" && (
                        <Button
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleAcceptDelivery(delivery.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Delivery
                        </Button>
                      )}
                      {delivery.deliveryStatus === "PICKED_UP" && (
                        <Button
                          className="bg-blue-500 hover:bg-blue-600"
                          onClick={() => handlePickupOrder(delivery.id)}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Start Delivery
                        </Button>
                      )}
                      {delivery.deliveryStatus === "OUT_FOR_DELIVERY" && (
                        <Button
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={() => handleDeliverOrder(delivery.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Delivered
                        </Button>
                      )}
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
                  No active deliveries
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== "all"
                    ? "No deliveries match your current filters."
                    : "You don't have any active deliveries at the moment."}
                </p>
                {(searchTerm || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear Filters
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
