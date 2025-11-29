"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  Package,
  Search,
  Loader2,
  Phone,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

interface TrackingStep {
  status: string;
  timestamp: string;
  location?: string;
  description: string;
  isCompleted: boolean;
}

interface DeliveryData {
  orderId: string;
  status: string;
  estimatedDelivery: string;
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  rider?: {
    name: string;
    phone: string;
    photo?: string;
  };
  trackingSteps: TrackingStep[];
}

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [trackingData, setTrackingData] = useState<DeliveryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);

  const handleTrackOrder = async () => {
    if (!orderId.trim()) {
      setError("Please enter an order ID");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/deliveries/tracking/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
        // Enable real-time updates after successful tracking
        setIsRealTimeEnabled(true);
      } else {
        setError("Order not found or tracking not available");
        setTrackingData(null);
        setIsRealTimeEnabled(false);
      }
    } catch (err) {
      setError("Failed to fetch tracking information");
      setTrackingData(null);
      setIsRealTimeEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time tracking updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRealTimeEnabled && orderId) {
      // Poll for updates every 30 seconds
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/deliveries/tracking/${orderId}`);
          if (response.ok) {
            const data = await response.json();
            setTrackingData((prevData) => {
              // Only update if there's new information
              if (JSON.stringify(data) !== JSON.stringify(prevData)) {
                // Show notification for status changes
                if (prevData && data.status !== prevData.status) {
                  // In a real app, you'd send a browser notification or show a toast
                  console.log(`Order status updated: ${data.status}`);
                }
                return data;
              }
              return prevData;
            });
          }
        } catch (error) {
          console.error("Error updating tracking data:", error);
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRealTimeEnabled, orderId]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";
      case "picked_up":
        return "bg-purple-100 text-purple-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string, isCompleted: boolean) => {
    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }

    switch (status.toLowerCase()) {
      case "ordered":
        return <Package className="h-5 w-5 text-gray-600" />;
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case "preparing":
        return <Clock className="h-5 w-5 text-orange-600" />;
      case "ready_for_pickup":
        return <Package className="h-5 w-5 text-purple-600" />;
      case "picked_up":
        return <Truck className="h-5 w-5 text-purple-600" />;
      case "out_for_delivery":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Track Your Order
            </h1>
            <p className="text-gray-600">
              Enter your order ID to get real-time delivery updates
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label
                  htmlFor="orderId"
                  className="text-sm font-medium mb-2 block"
                >
                  Order ID
                </Label>
                <Input
                  id="orderId"
                  type="text"
                  placeholder="Enter your order ID (e.g., ORD-123456)"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="text-lg"
                  onKeyPress={(e) => e.key === "Enter" && handleTrackOrder()}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleTrackOrder}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Track Order
                </Button>
              </div>
            </div>
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {trackingData && (
          <div className="space-y-6">
            {/* Order Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Order #{trackingData.orderId}
                    {isRealTimeEnabled && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live Updates
                      </div>
                    )}
                  </CardTitle>
                  <Badge className={getStatusColor(trackingData.status)}>
                    {trackingData.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Estimated Delivery
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(trackingData.estimatedDelivery)}
                    </p>
                  </div>
                  {trackingData.rider && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Delivery Partner
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {trackingData.rider.photo ? (
                            <img
                              src={trackingData.rider.photo}
                              alt={trackingData.rider.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-semibold">
                              {trackingData.rider.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {trackingData.rider.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{trackingData.rider.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {trackingData.currentLocation && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Current Location
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{trackingData.currentLocation.address}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {trackingData.trackingSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            step.isCompleted ? "bg-green-100" : "bg-gray-100"
                          }`}
                        >
                          {getStatusIcon(step.status, step.isCompleted)}
                        </div>
                        {index < trackingData.trackingSteps.length - 1 && (
                          <div
                            className={`w-0.5 h-8 mx-auto mt-2 ${
                              step.isCompleted ? "bg-green-300" : "bg-gray-300"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`font-medium ${
                              step.isCompleted
                                ? "text-green-800"
                                : "text-gray-800"
                            }`}
                          >
                            {step.status.replace("_", " ")}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {formatDate(step.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">
                          {step.description}
                        </p>
                        {step.location && (
                          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {step.location}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Need Help?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Contact our support team for any delivery-related queries
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Call Support
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat Support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        {!trackingData && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Track Your Delivery
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Enter your order ID above to get real-time updates on your
                delivery status, estimated arrival time, and delivery partner
                information.
              </p>
              <div className="text-left max-w-md mx-auto">
                <h4 className="font-semibold text-gray-900 mb-3">
                  What you can track:
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Order confirmation status</li>
                  <li>• Preparation progress</li>
                  <li>• Pickup and delivery times</li>
                  <li>• Real-time location updates</li>
                  <li>• Delivery partner contact info</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
