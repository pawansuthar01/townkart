"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Package,
  CheckCircle,
  Navigation,
  DollarSign,
} from "lucide-react";
import { MapView } from "./MapView";
import {
  DeliveryTrackingData,
  updateDeliveryStatus,
  updateDeliveryLocation,
} from "@/lib/deliveryTracking";

interface DeliveryCardProps {
  delivery: DeliveryTrackingData;
  onStatusUpdate?: (status: string) => void;
  className?: string;
}

type DeliveryStatus = "picked_up" | "in_transit" | "delivered";

export function DeliveryCard({
  delivery,
  onStatusUpdate,
  className = "",
}: DeliveryCardProps) {
  const [currentLocation, setCurrentLocation] =
    useState<GeolocationCoordinates | null>(null);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Get current location for rider tracking
  useEffect(() => {
    if (navigator.geolocation && delivery.delivery.status === "in_transit") {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation(position.coords);
          // Update delivery location on server
          updateLocation(position.coords);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        },
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [delivery.delivery.status]);

  const updateLocation = async (coords: GeolocationCoordinates) => {
    if (isUpdatingLocation) return;

    try {
      setIsUpdatingLocation(true);
      await updateDeliveryLocation(delivery.delivery.id, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date(),
        accuracy: coords.accuracy,
        speed: coords.speed || undefined,
        heading: coords.heading || undefined,
      });
    } catch (error) {
      console.error("Failed to update location:", error);
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleStatusUpdate = async (newStatus: DeliveryStatus) => {
    try {
      await updateDeliveryStatus(delivery.delivery.id, newStatus);
      onStatusUpdate?.(newStatus);
    } catch (error) {
      console.error("Failed to update delivery status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500";
      case "picked_up":
        return "bg-yellow-500";
      case "in_transit":
        return "bg-orange-500";
      case "delivered":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "assigned":
        return "Assigned to you";
      case "picked_up":
        return "Order picked up";
      case "in_transit":
        return "On the way";
      case "delivered":
        return "Delivered";
      case "failed":
        return "Delivery failed";
      default:
        return status;
    }
  };

  const canUpdateStatus = (currentStatus: string, newStatus: string) => {
    const statusFlow = {
      assigned: ["picked_up"],
      picked_up: ["in_transit"],
      in_transit: ["delivered"],
      delivered: [],
      failed: [],
    };
    return statusFlow[currentStatus as keyof typeof statusFlow]?.includes(
      newStatus,
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{delivery.delivery.orderId}
          </span>
          <Badge
            className={`${getStatusColor(delivery.delivery.status)} text-white`}
          >
            {getStatusText(delivery.delivery.status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Info */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <Avatar className="h-12 w-12">
            <AvatarImage src="" />
            <AvatarFallback>
              {delivery.customer.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {delivery.customer.name}
            </p>
            <p className="text-sm text-gray-600">{delivery.customer.phone}</p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <p className="text-xs text-gray-500">
                {delivery.customer.address.fullAddress}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`tel:${delivery.customer.phone}`)}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `https://wa.me/${delivery.customer.phone.replace(/\s+/g, "")}`,
                )
              }
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Delivery Route */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Pickup from</p>
                <p className="text-sm font-medium text-gray-700">
                  {delivery.shop.name}
                </p>
                <p className="text-xs text-gray-600">
                  {delivery.shop.address.fullAddress}
                </p>
              </div>
            </div>

            <div className="w-px h-8 bg-gray-300 ml-4"></div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Deliver to</p>
                <p className="text-sm font-medium text-gray-700">
                  {delivery.customer.name}
                </p>
                <p className="text-xs text-gray-600">
                  {delivery.customer.address.fullAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Map Toggle */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={() => setShowMap(!showMap)}
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {showMap ? "Hide Map" : "Show Route"}
            </Button>

            {delivery.delivery.distanceRemaining &&
              delivery.delivery.timeRemaining && (
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    {delivery.delivery.distanceRemaining < 1000
                      ? `${Math.round(delivery.delivery.distanceRemaining)}m away`
                      : `${(delivery.delivery.distanceRemaining / 1000).toFixed(1)}km away`}
                  </p>
                  <p className="text-xs text-gray-600">
                    ~{Math.ceil(delivery.delivery.timeRemaining)} min remaining
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="rounded-lg overflow-hidden border">
            <MapView
              deliveryData={delivery}
              showControls={false}
              interactive={true}
              className="border-0"
            />
          </div>
        )}

        {/* Earnings Info */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Delivery Earnings</p>
              <p className="text-sm text-gray-600">
                ₹45 (including incentives)
              </p>
            </div>
          </div>
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {canUpdateStatus(delivery.delivery.status, "picked_up") && (
            <Button
              onClick={() => handleStatusUpdate("picked_up")}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Package className="h-4 w-4 mr-2" />
              Mark as Picked Up
            </Button>
          )}

          {canUpdateStatus(delivery.delivery.status, "in_transit") && (
            <Button
              onClick={() => handleStatusUpdate("in_transit")}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Start Delivery
            </Button>
          )}

          {canUpdateStatus(delivery.delivery.status, "delivered") && (
            <Button
              onClick={() => handleStatusUpdate("delivered")}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Delivered
            </Button>
          )}
        </div>

        {/* Location Update Indicator */}
        {isUpdatingLocation && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Updating location...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
