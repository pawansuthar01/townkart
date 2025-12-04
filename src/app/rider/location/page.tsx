"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { LiveLocationMap } from "@/components/rider/LiveLocationMap";
import { LocationData, locationService } from "@/services/location.service";
import {
  MapPin,
  Navigation,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Settings,
  Activity,
  Power,
} from "lucide-react";

interface LocationStatus {
  isTracking: boolean;
  isOnline: boolean;
  lastUpdate: string | null;
  networkStatus: "online" | "offline";
  accuracy: number;
}

export default function RiderLocationPage() {
  const { user } = useAuth();
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

  useEffect(() => {
    // Check if location tracking is enabled
    const checkTrackingStatus = async () => {
      try {
        const response = await fetch("/api/riders/location/status");
        if (response.ok) {
          const data = await response.json();
          setLocationStatus((prev) => ({
            ...prev,
            isTracking: data.isTracking,
            lastUpdate: data.lastUpdate,
          }));
        }
      } catch (error) {
        console.error("Failed to check tracking status:", error);
      }
    };

    checkTrackingStatus();

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

    try {
      // Use the location service with accuracy validation
      const locationData = await locationService.requestLocation({
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for GPS
        maximumAge: 300000, // 5 minutes
        maxAccuracy: 1000, // 1km maximum accuracy
      });

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

      // Send location to server
      const response = await fetch("/api/riders/location", {
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
          errorData.message || "Failed to update location on server"
        );
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Location error:", error);
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

  const toggleLocationTracking = async () => {
    try {
      const newTrackingStatus = !locationStatus.isTracking;
      const response = await fetch("/api/riders/location/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newTrackingStatus }),
      });

      if (response.ok) {
        setLocationStatus((prev) => ({
          ...prev,
          isTracking: newTrackingStatus,
        }));
        if (newTrackingStatus) {
          getCurrentLocation();
        }
      } else {
        throw new Error("Failed to update tracking status");
      }
    } catch (error) {
      console.error("Failed to toggle location tracking:", error);
      alert("Failed to update location tracking status");
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile App Header Actions */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {locationStatus.isTracking ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live Tracking
              </Badge>
            ) : (
              <Badge variant="secondary">Tracking Off</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={locationStatus.isTracking}
              onCheckedChange={toggleLocationTracking}
              className="data-[state=checked]:bg-green-500"
            />
            <span className="text-sm font-medium">
              {locationStatus.isTracking ? "On" : "Off"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Live Map */}
        <LiveLocationMap
          locationData={locationData}
          isTracking={locationStatus.isTracking}
          onLocationUpdate={setLocationData}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <p className="text-gray-600 mb-4">
                    No location data available
                  </p>
                  <p className="text-sm text-gray-500">
                    Enable location tracking to see your live location
                  </p>
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
                  <span className="text-sm text-gray-600">Tracking</span>
                </div>
                <Badge
                  variant={locationStatus.isTracking ? "default" : "secondary"}
                  className={
                    locationStatus.isTracking
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {locationStatus.isTracking ? "Active" : "Inactive"}
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
        </div>

        {/* Location Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Location Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">High Accuracy Mode</p>
                <p className="text-sm text-gray-600">
                  Use GPS for more precise location (uses more battery)
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Background Location</p>
                <p className="text-sm text-gray-600">
                  Continue tracking when app is in background
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Location History</p>
                <p className="text-sm text-gray-600">
                  Keep location history for delivery tracking
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
