"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Truck,
  CheckCircle,
  Package,
  User,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { MapView, useDeliveryTracking } from "@/components/rider/MapView";
import {
  DeliveryTrackingData,
  getDeliveryStatusInfo,
  formatTimeRemaining,
  formatDistanceRemaining,
  getDeliveryTracking,
} from "@/lib/deliveryTracking";

interface OrderTrackingProps {
  orderId: string;
  className?: string;
}

export function OrderTracking({ orderId, className = "" }: OrderTrackingProps) {
  const [deliveryData, setDeliveryData] = useState<DeliveryTrackingData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use real-time tracking hook
  const {
    trackingData,
    isConnected,
    error: trackingError,
    reconnect,
  } = useDeliveryTracking(orderId);

  // Load initial order data
  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}/status`);
        if (!response.ok) {
          throw new Error("Failed to load order data");
        }
        const data = await response.json();

        // Transform data for compatibility with existing component
        const transformedData: DeliveryTrackingData = {
          delivery: {
            id: data.delivery?.id || `delivery_${orderId}`,
            orderId,
            riderId: data.delivery?.rider?.id || "",
            status: (data.delivery?.status?.toLowerCase() as any) || "assigned",
            statusMessage: `Order is ${data.delivery?.status || "being processed"}`,
            estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
            lastUpdated: new Date(),
          },
          rider: data.delivery?.rider ? {
            id: data.delivery.rider.id,
            name: data.delivery.rider.fullName,
            phone: data.delivery.rider.phoneNumber,
            vehicleType: "bike",
            vehicleNumber: "KA01AB1234",
            rating: 4.5,
          } : {
            id: "rider_default",
            name: "Rider Not Assigned",
            phone: "",
            vehicleType: "bike",
            vehicleNumber: "",
            rating: 0,
          },
          shop: {
            id: data.order.merchant.id,
            name: data.order.merchant.businessName,
            address: {
              latitude: 0,
              longitude: 0,
              fullAddress: data.order.merchant.address,
            },
          },
          customer: {
            id: data.order.customer.id,
            name: data.order.customer.fullName,
            phone: data.order.customer.phoneNumber,
            address: {
              latitude: 0,
              longitude: 0,
              fullAddress: data.order.deliveryAddress?.line1 || "Delivery Address",
            },
          },
        };

        setDeliveryData(transformedData);
      } catch (err: any) {
        setError(err.message || "Failed to load order information");
        console.error("Error loading order data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId]);

  // Update delivery data when real-time data arrives
  useEffect(() => {
    if (trackingData) {
      setDeliveryData(trackingData);
    }
  }, [trackingData]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading delivery tracking...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !deliveryData) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error || "Delivery information not available"}
            </h3>
            <p className="text-gray-600 mb-4">
              We couldn't load the delivery tracking information. Please try
              again.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getDeliveryStatusInfo(deliveryData.delivery.status);
  const progressSteps = [
    {
      status: "ORDER_PLACED",
      label: "Order Placed",
      completed: true, // Always completed if we have delivery data
    },
    {
      status: "STORE_ASSIGNED",
      label: "Store Assigned",
      completed: ["assigned", "picked_up", "in_transit", "delivered"].includes(
        deliveryData.delivery.status,
      ),
    },
    {
      status: "BEING_PREPARED",
      label: "Being Prepared",
      completed: ["assigned", "picked_up", "in_transit", "delivered"].includes(
        deliveryData.delivery.status,
      ),
    },
    {
      status: "READY_FOR_PICKUP",
      label: "Ready for Pickup",
      completed: ["assigned", "picked_up", "in_transit", "delivered"].includes(
        deliveryData.delivery.status,
      ),
    },
    {
      status: "RIDER_ASSIGNED",
      label: "Rider Assigned",
      completed: ["assigned", "picked_up", "in_transit", "delivered"].includes(
        deliveryData.delivery.status,
      ),
    },
    {
      status: "EN_ROUTE",
      label: "En Route",
      completed: ["picked_up", "in_transit", "delivered"].includes(
        deliveryData.delivery.status,
      ),
    },
    {
      status: "delivered",
      label: "Delivered",
      completed: deliveryData.delivery.status === "delivered",
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Live Map View */}
      <MapView
        deliveryData={deliveryData}
        showControls={true}
        interactive={true}
      />

      {/* Delivery Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Progress
            </span>
            {isConnected ? (
              <Badge className="bg-green-500 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                Live Tracking
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                <RefreshCw className="h-3 w-3 mr-1" />
                Connecting...
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="space-y-4 mb-6">
            {progressSteps.map((step, index) => (
              <div key={step.status} className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="w-2 h-2 bg-current rounded-full"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${step.completed ? "text-gray-900" : "text-gray-500"}`}
                  >
                    {step.label}
                  </p>
                  {index ===
                    progressSteps.findIndex(
                      (s) => s.status === deliveryData.delivery.status,
                    ) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {statusInfo.description}
                    </p>
                  )}
                </div>
                {step.status === deliveryData.delivery.status &&
                  deliveryData.delivery.timeRemaining && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatTimeRemaining(
                          deliveryData.delivery.timeRemaining,
                        )}
                      </p>
                      <p className="text-xs text-gray-600">remaining</p>
                    </div>
                  )}
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Rider Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Delivery Partner</h3>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {deliveryData.rider.name}
                </p>
                <p className="text-sm text-gray-600">
                  {deliveryData.rider.vehicleType} • ⭐{" "}
                  {deliveryData.rider.rating}
                </p>
                <p className="text-xs text-gray-500">
                  {deliveryData.rider.vehicleNumber}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`tel:${deliveryData.rider.phone}`)}
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `https://wa.me/${deliveryData.rider.phone.replace(/\s+/g, "")}`,
                    )
                  }
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Delivery Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Pickup Location
              </h4>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {deliveryData.shop.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {deliveryData.shop.address.fullAddress}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">
                Delivery Location
              </h4>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">
                    {deliveryData.customer.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {deliveryData.customer.address.fullAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated Delivery Time */}
          {deliveryData.delivery.estimatedDeliveryTime && (
            <>
              <Separator className="my-6" />
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Estimated Delivery
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(
                        deliveryData.delivery.estimatedDeliveryTime,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {deliveryData.delivery.distanceRemaining &&
                  deliveryData.delivery.timeRemaining && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {formatTimeRemaining(
                          deliveryData.delivery.timeRemaining,
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDistanceRemaining(
                          deliveryData.delivery.distanceRemaining,
                        )}{" "}
                        away
                      </p>
                    </div>
                  )}
              </div>
            </>
          )}

          {/* Connection Status */}
          {trackingError && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Live tracking temporarily unavailable. {trackingError}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="ml-auto"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for order tracking page
export function useOrderTracking(orderId: string) {
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true);
        // In a real app, this would fetch from your orders API
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error("Order not found");
        }
        const data = await response.json();
        setOrderData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  return { orderData, loading, error };
}
