"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Bike,
  Store,
  RefreshCw,
  Eye,
  Navigation,
  AlertTriangle,
} from "lucide-react";

interface RiderLocation {
  id: string;
  riderId: string;
  riderName: string;
  phone: string;
  latitude: number;
  longitude: number;
  status: string;
  lastUpdate: string;
  currentDelivery?: {
    id: string;
    orderNumber: string;
    storeName: string;
    customerLocation: {
      lat: number;
      lng: number;
    };
  };
}

interface StoreLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  isActive: boolean;
}

interface LocationAlert {
  id: string;
  riderId: string;
  riderName: string;
  type: string;
  message: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
}

export default function AdminRiderLocationsPage() {
  const [riderLocations, setRiderLocations] = useState<RiderLocation[]>([]);
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [alerts, setAlerts] = useState<LocationAlert[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.209 }); // Default to Delhi

  useEffect(() => {
    fetchLocations();
    // Set up polling for real-time updates
    const interval = setInterval(fetchLocations, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLocations = async () => {
    try {
      // Fetch rider locations
      const ridersResponse = await fetch("/api/admin/riders/locations");
      if (ridersResponse.ok) {
        const ridersData = await ridersResponse.json();
        if (ridersData.success) {
          setRiderLocations(ridersData.locations);
        }
      }

      // Fetch store locations
      const storesResponse = await fetch("/api/admin/stores?limit=100");
      if (storesResponse.ok) {
        const storesData = await storesResponse.json();
        if (storesData.success) {
          setStoreLocations(storesData.stores);
        }
      }

      // Fetch location alerts
      const alertsResponse = await fetch("/api/admin/rider-location-alerts");
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        if (alertsData.success) {
          setAlerts(alertsData.alerts || []);
        }
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-500";
      case "BUSY":
        return "bg-blue-500";
      case "OFFLINE":
        return "bg-gray-500";
      case "EN_ROUTE":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getNearbyStores = (
    riderLat: number,
    riderLng: number,
    maxDistance = 5
  ) => {
    return storeLocations.filter(
      (store) =>
        calculateDistance(
          riderLat,
          riderLng,
          store.latitude,
          store.longitude
        ) <= maxDistance
    );
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
          <h1 className="text-3xl font-bold text-gray-900">
            Rider Location Monitoring
          </h1>
          <p className="text-gray-600">
            Track all riders and their locations relative to stores
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLocations} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Select value={selectedRider} onValueChange={setSelectedRider}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Focus on rider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Riders</SelectItem>
              {riderLocations.map((rider) => (
                <SelectItem key={rider.id} value={rider.id}>
                  {rider.riderName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Riders</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                riderLocations.filter(
                  (r) => r.status === "AVAILABLE" || r.status === "BUSY"
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Delivery</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {riderLocations.filter((r) => r.status === "EN_ROUTE").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storeLocations?.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Location Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Map integration would go here</p>
                <p className="text-sm text-gray-500 mt-2">
                  Showing {riderLocations?.length || 0} riders and{" "}
                  {storeLocations?.length || 0} stores
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rider List */}
        <Card>
          <CardHeader>
            <CardTitle>Rider Status ({riderLocations?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {riderLocations?.map((rider) => {
                const nearbyStores = getNearbyStores(
                  rider.latitude,
                  rider.longitude
                );
                return (
                  <div key={rider.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${getStatusColor(rider.status)}`}
                        />
                        <span className="font-medium text-sm">
                          {rider.riderName}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rider.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>📱 {rider.phone}</div>
                      <div>
                        📍 {rider.latitude.toFixed(4)},{" "}
                        {rider.longitude.toFixed(4)}
                      </div>
                      <div>🏪 {nearbyStores?.length} stores nearby</div>
                      {rider?.currentDelivery && (
                        <div className="text-blue-600">
                          🚚 Delivering: {rider.currentDelivery.orderNumber}
                        </div>
                      )}
                      <div className="text-gray-500">
                        Updated:{" "}
                        {new Date(rider?.lastUpdate).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Alerts */}
      {(alerts?.length || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Location Alerts ({alerts?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border rounded-lg p-3 ${getAlertSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">{alert.riderName}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-sm mt-1">{alert.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store Locations Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Store Locations ({storeLocations?.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storeLocations?.slice(0, 9).map((store) => (
              <div key={store.id} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">{store.name}</span>
                  <Badge
                    variant={store.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {store.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600">
                  <div>
                    📍 {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                  </div>
                  <div className="mt-1">{store.address}</div>
                </div>
              </div>
            ))}
          </div>
          {storeLocations?.length > 9 && (
            <div className="text-center mt-4">
              <Button variant="outline">View All Stores</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
