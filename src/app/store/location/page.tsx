"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { LocationData, locationService } from "@/services/location.service";
import { useSocket } from "@/lib/socket";
import {
  MapPin,
  Navigation,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Activity,
  Power,
  Store,
} from "lucide-react";

interface LocationStatus {
  isTracking: boolean;
  isOnline: boolean;
  lastUpdate: string | null;
  networkStatus: "online" | "offline";
  accuracy: number;
}

export default function StoreLocationPage() {
  const { user } = useAuth();
  const socket = useSocket();
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>({
    isTracking: false,
    isOnline: navigator.onLine,
    lastUpdate: null,
    networkStatus: navigator.onLine ? "online" : "offline",
    accuracy: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<{
    granted: boolean;
    denied: boolean;
    prompt: boolean;
    unavailable: boolean;
  } | null>(null);
  const [storeInfo, setStoreInfo] = useState<{
    id: string;
    name: string;
    address: string;
  } | null>(null);

  useEffect(() => {
    // Check location permission on page load
    const checkPermissions = async () => {
      try {
        const status = await locationService.checkPermission();
        console.log("Store location permission status:", status);
        setPermissionStatus(status);
      } catch (error) {
        console.error("Failed to check location permission:", error);
      }
    };

    // Get store information
    const getStoreInfo = async () => {
      try {
        const response = await fetch("/api/store/location");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.store) {
            setStoreInfo(data.data.store);
          }
        }
      } catch (error) {
        console.error("Failed to get store info:", error);
      }
    };

    checkPermissions();
    getStoreInfo();

    // Listen for online/offline events
    const handleOnline = () =>
      setLocationStatus((prev) => ({
        ...prev,
        networkStatus: "online",
        isOnline: true,
      }));
    const handleOffline = () =>
      setLocationStatus((prev) => ({
        ...prev,
        networkStatus: "offline",
        isOnline: false,
      }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    console.log("Getting store current location...");

    try {
      // Use the location service with accuracy validation
      console.log("Calling locationService.requestLocation...");
      const locationData = await locationService.requestLocation({
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for GPS
        maximumAge: 300000, // 5 minutes
        maxAccuracy: 1000, // 1km maximum accuracy
      });
      console.log("Store location received:", locationData);

      const newLocationData: LocationData = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: new Date(locationData.timestamp).toISOString(),
        speed: locationData.speed,
        heading: locationData.heading,
      };

      setLocationData(newLocationData);
      setLocationStatus((prev) => ({
        ...prev,
        lastUpdate: new Date().toISOString(),
        accuracy: locationData.accuracy || 0,
      }));

      // Send location to server via API
      const response = await fetch("/api/store/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          speed: locationData.speed,
          heading: locationData.heading,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update store location on server"
        );
      }

      // Send location update via WebSocket
      socket.sendLocationUpdate({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        speed: locationData.speed,
        heading: locationData.heading,
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Store location error:", error);
      let errorMessage = "Unable to retrieve accurate location";

      if (error instanceof Error) {
        if (error.message.includes("accuracy too low")) {
          errorMessage = error.message;
        } else if (error.message.includes("permission denied")) {
          errorMessage =
            "Location access denied. Please enable location permissions in your browser settings.";
        } else if (error.message.includes("unavailable")) {
          errorMessage =
            "Location information is unavailable. Please check your GPS settings.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Location request timed out. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  const formatAccuracy = (accuracy: number) => {
    if (accuracy < 100) return `${Math.round(accuracy)}m`;
    return `${(accuracy / 1000).toFixed(1)}km`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return "text-green-600";
    if (accuracy <= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Requesting store location permission...");

      // Request permission explicitly
      const status = await locationService.requestPermission();
      console.log("Store permission request result:", status);
      setPermissionStatus(status);

      if (status.granted) {
        console.log("Store permission granted, getting location...");
        // Permission granted, get current location
        await getCurrentLocation();
      } else if (status.denied) {
        setError(
          "Location permission was denied. Please enable location permissions in your browser settings."
        );
      } else if (status.unavailable) {
        setError("Location services are not available on this device.");
      } else {
        console.log(
          "Store permission status unclear, trying to get location anyway..."
        );
        // Try to get location even if status is unclear
        await getCurrentLocation();
      }
    } catch (error) {
      console.error("Store permission request failed:", error);
      setError("Failed to request location permission. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store Header */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold">
              {storeInfo?.name || "Store Location"}
            </h1>
            <p className="text-sm text-gray-600">
              {storeInfo?.address || "Update your store location"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Store Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Permission Status */}
            {permissionStatus && (
              <div className="mb-4 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {permissionStatus.granted ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : permissionStatus.denied ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium">
                      Location Permission
                    </span>
                  </div>
                  <Badge
                    variant={permissionStatus.granted ? "default" : "secondary"}
                    className={
                      permissionStatus.granted
                        ? "bg-green-100 text-green-800"
                        : permissionStatus.denied
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {permissionStatus.granted
                      ? "Granted"
                      : permissionStatus.denied
                        ? "Denied"
                        : "Prompt"}
                  </Badge>
                </div>
                {!permissionStatus.granted && !permissionStatus.denied && (
                  <Button
                    className="mt-2 w-full"
                    size="sm"
                    onClick={requestLocationPermission}
                    disabled={isLoading}
                  >
                    {isLoading ? "Requesting..." : "Request Permission"}
                  </Button>
                )}
              </div>
            )}

            {locationData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Latitude</p>
                    <p className="text-lg font-mono font-medium">
                      {formatCoordinate(locationData.latitude)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Longitude</p>
                    <p className="text-lg font-mono font-medium">
                      {formatCoordinate(locationData.longitude)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Accuracy</p>
                    <p
                      className={`text-lg font-medium ${getAccuracyColor(locationData.accuracy)}`}
                    >
                      {formatAccuracy(locationData.accuracy)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Update</p>
                    <p className="text-sm font-medium">
                      {new Date(locationData.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {locationData.speed !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">Speed</p>
                    <p className="text-lg font-medium">
                      {(locationData.speed * 3.6).toFixed(1)} km/h
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Store location not set</p>
                <p className="text-sm text-gray-500">
                  Update your store location for accurate delivery routing
                </p>
                {(permissionStatus?.granted || permissionStatus?.prompt) && (
                  <Button
                    className="mt-4"
                    onClick={getCurrentLocation}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Getting Location..."
                      : "Update Store Location"}
                  </Button>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Device Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">Location Tracking</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {locationStatus.networkStatus === "online" ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">Network</span>
              </div>
              <span className="text-sm capitalize">
                {locationStatus.networkStatus}
              </span>
            </div>

            {locationStatus.lastUpdate && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Last Update</span>
                </div>
                <span className="text-sm">
                  {new Date(locationStatus.lastUpdate).toLocaleTimeString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Information */}
        {storeInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Store Name</p>
                <p className="text-lg font-medium">{storeInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="text-sm">{storeInfo.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Store ID</p>
                <p className="text-sm font-mono">{storeInfo.id}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
