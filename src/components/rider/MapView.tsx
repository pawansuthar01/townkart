"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  DeliveryTrackingData,
  DeliveryTracker,
  getDeliveryStatusInfo,
  formatTimeRemaining,
  formatDistanceRemaining,
} from "@/lib/deliveryTracking";
import {
  MapIntegration,
  MapMarker,
  MapRoute,
} from "@/components/shared/MapIntegration";

interface MapViewProps {
  deliveryData: DeliveryTrackingData;
  className?: string;
  showControls?: boolean;
  interactive?: boolean;
}

export function MapView({
  deliveryData,
  className = "",
  showControls = true,
  interactive = true,
}: MapViewProps) {
  // Prepare markers for the map
  const markers: MapMarker[] = [
    {
      id: "customer",
      latitude: deliveryData.customer.address.latitude,
      longitude: deliveryData.customer.address.longitude,
      title: `Delivery Address: ${deliveryData.customer.address.fullAddress}`,
      type: "delivery",
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">${deliveryData.customer.name}</h3>
          <p class="text-sm text-gray-600">${deliveryData.customer.address.fullAddress}</p>
          <p class="text-sm text-gray-600">📞 ${deliveryData.customer.phone}</p>
        </div>
      `,
    },
    {
      id: "shop",
      latitude: deliveryData.shop.address.latitude,
      longitude: deliveryData.shop.address.longitude,
      title: `Shop: ${deliveryData.shop.name}`,
      type: "shop",
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">${deliveryData.shop.name}</h3>
          <p class="text-sm text-gray-600">${deliveryData.shop.address.fullAddress}</p>
        </div>
      `,
    },
  ];

  // Add rider marker if location available
  if (deliveryData.delivery.currentLocation) {
    markers.push({
      id: "rider",
      latitude: deliveryData.delivery.currentLocation.latitude,
      longitude: deliveryData.delivery.currentLocation.longitude,
      title: `Rider: ${deliveryData.rider.name}`,
      type: "rider",
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">${deliveryData.rider.name}</h3>
          <p class="text-sm text-gray-600">⭐ ${deliveryData.rider.rating} rating</p>
          <p class="text-sm text-gray-600">📞 ${deliveryData.rider.phone}</p>
          <p class="text-sm text-gray-600">🏍️ ${deliveryData.rider.vehicleType} - ${deliveryData.rider.vehicleNumber}</p>
        </div>
      `,
    });
  }

  // Prepare route
  const routes: MapRoute[] = [];
  if (deliveryData.delivery.currentLocation) {
    routes.push({
      id: "delivery-route",
      origin: {
        latitude: deliveryData.delivery.currentLocation.latitude,
        longitude: deliveryData.delivery.currentLocation.longitude,
      },
      destination: {
        latitude: deliveryData.customer.address.latitude,
        longitude: deliveryData.customer.address.longitude,
      },
      color: "#f59e0b",
      strokeWeight: 4,
    });
  }

  // Calculate center point
  const center = deliveryData.delivery.currentLocation
    ? {
        latitude: deliveryData.delivery.currentLocation.latitude,
        longitude: deliveryData.delivery.currentLocation.longitude,
      }
    : {
        latitude: deliveryData.customer.address.latitude,
        longitude: deliveryData.customer.address.longitude,
      };

  const statusInfo = getDeliveryStatusInfo(deliveryData.delivery.status);

  return (
    <div className={className}>
      <MapIntegration
        center={center}
        zoom={14}
        markers={markers}
        routes={routes}
        showControls={showControls}
        interactive={interactive}
        enableGeolocation={false}
        showTrafficLayer={false}
        height="400px"
        className="mb-4"
      />

      {/* Delivery Info Overlay */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {deliveryData.rider.name}
                </p>
                <p className="text-sm text-gray-600">
                  {deliveryData.rider.vehicleType} •{" "}
                  {deliveryData.rider.vehicleNumber}
                </p>
              </div>
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
          </div>

          {/* Delivery Progress */}
          {deliveryData.delivery.distanceRemaining &&
            deliveryData.delivery.timeRemaining && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDistanceRemaining(
                      deliveryData.delivery.distanceRemaining,
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTimeRemaining(deliveryData.delivery.timeRemaining)}
                  </div>
                  <div className="text-sm text-gray-600">ETA</div>
                </div>
              </div>
            )}

          {/* Status Message */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg mb-4">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{statusInfo.label}</p>
              <p className="text-sm text-gray-600">{statusInfo.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {showControls && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`tel:${deliveryData.rider.phone}`)}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Rider
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() =>
                  window.open(
                    `https://wa.me/${deliveryData.rider.phone.replace(/\s+/g, "")}`,
                  )
                }
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for using delivery tracking
export function useDeliveryTracking(deliveryId: string) {
  const [trackingData, setTrackingData] = useState<DeliveryTrackingData | null>(
    null,
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracker, setTracker] = useState<DeliveryTracker | null>(null);

  useEffect(() => {
    if (!deliveryId) return;

    const trackerInstance = new DeliveryTracker(deliveryId);
    setTracker(trackerInstance);

    const connect = async () => {
      try {
        await trackerInstance.connect();
        setIsConnected(true);
        setError(null);
      } catch (err) {
        console.error("Failed to connect to delivery tracking:", err);
        setError("Failed to connect to live tracking");
        setIsConnected(false);
      }
    };

    connect();

    // Subscribe to updates
    const subscriptionId = trackerInstance.subscribe((data) => {
      setTrackingData(data);
    });

    return () => {
      trackerInstance.unsubscribe(subscriptionId);
      trackerInstance.disconnect();
    };
  }, [deliveryId]);

  return {
    trackingData,
    isConnected,
    error,
    reconnect: () => {
      if (tracker) {
        tracker.connect();
      }
    },
  };
}
