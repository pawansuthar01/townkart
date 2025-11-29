"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Phone,
  Clock,
  RefreshCw,
  Bike,
  Package,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RiderLocation {
  deliveryId: string;
  orderId: string;
  orderNumber: string;
  deliveryAddress: any;
  rider: {
    id: string;
    name: string;
    phone: string;
  };
  status: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
    activity: string;
  } | null;
  pickupTime: string | null;
  estimatedDeliveryTime: string | null;
}

export default function StoreRiderLocationsPage() {
  const { user } = useAuth();
  const [riderLocations, setRiderLocations] = useState<RiderLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<RiderLocation | null>(
    null,
  );
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    fetchRiderLocations();

    // Set up polling for real-time updates (fallback)
    const interval = setInterval(fetchRiderLocations, 30000); // Update every 30 seconds

    // Set up WebSocket connection for real-time updates
    if (user?.id) {
      setupWebSocket();
    }

    return () => {
      clearInterval(interval);
      if (ws) {
        ws.close();
      }
    };
  }, [user?.id]);

  const setupWebSocket = () => {
    if (!user?.id) return;

    // Get store ID from user session data
    const storeId = (user as any)?.storeData?.storeId;
    if (!storeId) return;

    const wsUrl = `ws://localhost:3001?userId=${user.id}&userType=store_manager&storeId=${storeId}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected for rider locations");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "rider_location_update") {
          // Update the specific rider's location in real-time
          setRiderLocations((prevLocations) =>
            prevLocations.map((location) =>
              location.rider.id === message.riderId
                ? {
                    ...location,
                    currentLocation: {
                      latitude: message.location.latitude,
                      longitude: message.location.longitude,
                      accuracy: message.location.accuracy || 0,
                      timestamp: message.timestamp,
                      activity: message.location.activity || "moving",
                    },
                  }
                : location,
            ),
          );
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      setWs(null);
      // Attempt to reconnect after a delay
      setTimeout(setupWebSocket, 5000);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  const fetchRiderLocations = async () => {
    try {
      const response = await fetch("/api/store/rider-locations");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRiderLocations(data.riderLocations);
        }
      }
    } catch (error) {
      console.error("Error fetching rider locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-500";
      case "PICKED_UP":
        return "bg-yellow-500";
      case "OUT_FOR_DELIVERY":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "Assigned";
      case "PICKED_UP":
        return "Picked Up";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rider Locations</h1>
          <p className="text-gray-600">
            Track your delivery riders in real-time
          </p>
        </div>
        <Button onClick={fetchRiderLocations} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Riders</p>
                <p className="text-2xl font-bold">{riderLocations.length}</p>
              </div>
              <Bike className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out for Delivery</p>
                <p className="text-2xl font-bold">
                  {
                    riderLocations.filter(
                      (r) => r.status === "OUT_FOR_DELIVERY",
                    ).length
                  }
                </p>
              </div>
              <Navigation className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Picked Up</p>
                <p className="text-2xl font-bold">
                  {
                    riderLocations.filter((r) => r.status === "PICKED_UP")
                      .length
                  }
                </p>
              </div>
              <Package className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rider Locations List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rider Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {riderLocations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No active riders
              </h3>
              <p className="text-gray-600">
                There are no riders currently assigned to your orders.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {riderLocations.map((location) => (
                <Card
                  key={location.deliveryId}
                  className="border-l-4 border-l-blue-500"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="font-semibold text-gray-900">
                            {location.rider.name}
                          </h3>
                          <Badge
                            className={`${getStatusColor(location.status)} text-white`}
                          >
                            {getStatusLabel(location.status)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <Package className="h-4 w-4 mr-1" />
                              <span>Order: {location.orderNumber}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <Phone className="h-4 w-4 mr-1" />
                              <span>{location.rider.phone}</span>
                            </div>
                          </div>
                          <div>
                            {location.currentLocation ? (
                              <>
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  <span>
                                    Lat:{" "}
                                    {location.currentLocation.latitude.toFixed(
                                      4,
                                    )}
                                    , Lng:{" "}
                                    {location.currentLocation.longitude.toFixed(
                                      4,
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>
                                    Updated:{" "}
                                    {new Date(
                                      location.currentLocation.timestamp,
                                    ).toLocaleTimeString()}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500">
                                Location not available
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-600">
                            Activity:{" "}
                            {location.currentLocation?.activity || "Unknown"}
                          </div>
                          {location.pickupTime && (
                            <div className="text-sm text-gray-600">
                              Picked up:{" "}
                              {new Date(
                                location.pickupTime,
                              ).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 mt-4 md:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRider(location)}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          View on Map
                        </Button>
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4 mr-1" />
                          Call Rider
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Modal - Placeholder for now */}
      {selectedRider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedRider.rider.name}'s Location
            </h3>
            {selectedRider.currentLocation ? (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Coordinates:</strong>{" "}
                  {selectedRider.currentLocation.latitude.toFixed(4)},{" "}
                  {selectedRider.currentLocation.longitude.toFixed(4)}
                </p>
                <p className="text-sm">
                  <strong>Last Updated:</strong>{" "}
                  {new Date(
                    selectedRider.currentLocation.timestamp,
                  ).toLocaleString()}
                </p>
                <p className="text-sm">
                  <strong>Activity:</strong>{" "}
                  {selectedRider.currentLocation.activity}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Location data not available
              </p>
            )}
            <Button
              onClick={() => setSelectedRider(null)}
              className="mt-4 w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
