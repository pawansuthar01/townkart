"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, Phone, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RiderLocation {
  latitude: number;
  longitude: number;
  lastUpdate: string;
}

interface DeliveryTrackerProps {
  deliveryId: string;
  onLocationUpdate?: (location: RiderLocation) => void;
}

export function DeliveryTracker({
  deliveryId,
  onLocationUpdate,
}: DeliveryTrackerProps) {
  const { user } = useAuth();
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(
    null,
  );
  const [deliveryStatus, setDeliveryStatus] = useState<string>("");
  const [riderInfo, setRiderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial delivery location
  const fetchDeliveryLocation = async () => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}/location`);
      const data = await response.json();

      if (data.success) {
        setRiderInfo(data.data.rider);
        setDeliveryStatus(data.data.deliveryStatus);
        if (data.data.rider?.currentLocation) {
          setRiderLocation(data.data.rider.currentLocation);
          onLocationUpdate?.(data.data.rider.currentLocation);
        }
      } else {
        setError(data.message || "Failed to fetch delivery location");
      }
    } catch (err) {
      setError("Failed to connect to tracking service");
    } finally {
      setLoading(false);
    }
  };

  // WebSocket connection for real-time updates
  const connectWebSocket = () => {
    if (!user?.id) return;

    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws?deliveryId=${deliveryId}&userId=${user.id}&userType=customer`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("Connected to delivery tracking");
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case "location_update":
            const newLocation = {
              latitude: message.location.latitude,
              longitude: message.location.longitude,
              lastUpdate: message.timestamp,
            };
            setRiderLocation(newLocation);
            onLocationUpdate?.(newLocation);
            break;

          case "delivery_state":
            setDeliveryStatus(message.data.status);
            if (message.data.rider?.location) {
              setRiderLocation(message.data.rider.location);
              onLocationUpdate?.(message.data.rider.location);
            }
            break;

          case "pong":
            // Keep-alive response
            break;
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected, attempting reconnect...");
      // Attempt to reconnect after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Real-time tracking connection lost");
    };

    wsRef.current = ws;

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => clearInterval(pingInterval);
  };

  useEffect(() => {
    fetchDeliveryLocation();
    const cleanup = connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      cleanup?.();
    };
  }, [deliveryId, user?.id]);

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
        return "Rider Assigned";
      case "PICKED_UP":
        return "Order Picked Up";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";
      case "DELIVERED":
        return "Delivered";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-2">Loading delivery tracking...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <MapPin className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold">Tracking Unavailable</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchDeliveryLocation}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Navigation className="h-5 w-5 mr-2" />
          Live Delivery Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={`${getStatusColor(deliveryStatus)} text-white`}>
              {getStatusText(deliveryStatus)}
            </Badge>
          </div>

          {/* Rider Info */}
          {riderInfo && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="font-semibold">{riderInfo.name}</p>
                  <p className="text-sm text-gray-600">Your delivery rider</p>
                </div>
              </div>

              {riderLocation && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>Location updated</span>
                    <Clock className="h-4 w-4 ml-2 mr-1" />
                    <span>
                      {new Date(riderLocation.lastUpdate).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    Coordinates: {riderLocation.latitude.toFixed(6)},{" "}
                    {riderLocation.longitude.toFixed(6)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center justify-between text-sm">
            <span>Real-time tracking:</span>
            <Badge
              variant={
                wsRef.current?.readyState === WebSocket.OPEN
                  ? "default"
                  : "secondary"
              }
            >
              {wsRef.current?.readyState === WebSocket.OPEN
                ? "Connected"
                : "Disconnected"}
            </Badge>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              📍 Track your rider's location in real-time as they deliver your
              order. You'll receive updates automatically when the rider moves.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
