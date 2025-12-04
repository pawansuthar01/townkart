"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";
import { useAuth } from "@/hooks/useAuth";
import { LocationData } from "@/services/location.service";

interface LiveLocationMapProps {
  locationData: LocationData | null;
  isTracking: boolean;
  onLocationUpdate: (location: LocationData) => void;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export function LiveLocationMap({
  locationData,
  isTracking,
  onLocationUpdate,
  className = "",
}: LiveLocationMapProps) {
  const { user, logout } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const accuracyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [accuracyIssue, setAccuracyIssue] = useState(false);
  const [accuracyWarningTime, setAccuracyWarningTime] = useState<number | null>(
    null
  );
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  // Load Google Maps API using centralized loader
  useEffect(() => {
    if (window.google) {
      setMapLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMapError("Google Maps API key not configured");
      return;
    }

    loadGoogleMaps(apiKey, ["geometry"])
      .then(() => {
        setMapLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load Google Maps:", error);
        setMapError("Failed to load Google Maps");
      });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || googleMapRef.current) return;

    try {
      const defaultLocation = { lat: 26.6139, lng: 74.209 };

      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: defaultLocation,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      // Add rider marker
      markerRef.current = new window.google.maps.Marker({
        position: defaultLocation,
        map: googleMapRef.current,
        title: "Your Location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#39B54A", // townkart-accent
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      // Add accuracy circle
      const accuracyCircle = new window.google.maps.Circle({
        strokeColor: "#39B54A", // townkart-accent
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: "#39B54A", // townkart-accent
        fillOpacity: 0.1,
        map: googleMapRef.current,
        center: defaultLocation,
        radius: 50,
      });

      markerRef.current.accuracyCircle = accuracyCircle;
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to initialize map");
    }
  }, [mapLoaded]);

  // Monitor location accuracy and handle poor accuracy issues
  useEffect(() => {
    if (!locationData) return;

    const accuracy = locationData.accuracy;
    const ACCURACY_THRESHOLD = 10; // 10 meters
    const TIMEOUT_MINUTES = 10;

    if (accuracy > ACCURACY_THRESHOLD) {
      // Poor accuracy detected
      if (!accuracyIssue) {
        setAccuracyIssue(true);
        setAccuracyWarningTime(Date.now());
        setShowTroubleshooting(true);
      }

      // Start 10-minute timer if not already started
      if (!accuracyTimerRef.current) {
        accuracyTimerRef.current = setTimeout(
          async () => {
            // Update rider status to inactive
            try {
              await fetch("/api/riders/status", {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: user?.id,
                  status: "INACTIVE",
                  reason: "Poor location accuracy for 10+ minutes",
                }),
              });
            } catch (error) {
              console.error("Failed to update rider status:", error);
            }

            // Show final warning before logout
            alert(
              "Your location accuracy has been poor for 10 minutes. You will now be logged out for safety reasons. Please check your device GPS settings and contact support if the issue persists."
            );

            // Logout the user
            if (logout) {
              logout();
            }
          },
          TIMEOUT_MINUTES * 60 * 1000
        );
      }
    } else {
      // Good accuracy - clear issues
      if (accuracyIssue) {
        setAccuracyIssue(false);
        setAccuracyWarningTime(null);
        setShowTroubleshooting(false);

        if (accuracyTimerRef.current) {
          clearTimeout(accuracyTimerRef.current);
          accuracyTimerRef.current = null;
        }
      }
    }
  }, [locationData, accuracyIssue, user?.id, logout]);

  // Update map when location changes
  useEffect(() => {
    if (!googleMapRef.current || !markerRef.current || !locationData) return;

    const position = {
      lat: locationData.latitude,
      lng: locationData.longitude,
    };

    // Update marker position
    markerRef.current.setPosition(position);

    // Update accuracy circle
    if (markerRef.current.accuracyCircle) {
      markerRef.current.accuracyCircle.setCenter(position);
      markerRef.current.accuracyCircle.setRadius(locationData.accuracy);
    }

    // Center map on location
    googleMapRef.current.setCenter(position);

    // Add location update animation
    markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE);
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.setAnimation(null);
      }
    }, 2000);
  }, [locationData]);

  // Auto-update location when tracking is enabled
  useEffect(() => {
    if (!isTracking || !navigator.geolocation) return;

    const updateLocation = () => {
      setIsUpdating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
          };

          onLocationUpdate(newLocationData);
          setIsUpdating(false);
        },
        (error) => {
          console.error("Location update error:", error);
          setIsUpdating(false);

          // Handle specific geolocation errors
          let errorMessage = "Failed to get location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location access denied. Please enable location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage =
                "Location information unavailable. Please check your GPS.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = "An unknown location error occurred.";
              break;
          }

          // Show user-friendly error (could integrate with toast notification)
          console.warn("Geolocation error:", errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000, // Accept cached location up to 30 seconds old
        }
      );
    };

    // Initial location update
    updateLocation();

    // Set up continuous location tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        };

        onLocationUpdate(newLocationData);
      },
      (error) => {
        console.error("Location watch error:", error);
        // Handle watch position errors similarly
        let errorMessage = "Location tracking failed";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied for continuous tracking.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location tracking unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location tracking timed out.";
            break;
        }
        console.warn("Location tracking error:", errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, onLocationUpdate]);

  const handleManualUpdate = () => {
    if (!navigator.geolocation) return;

    setIsUpdating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
        };

        onLocationUpdate(newLocationData);
        setIsUpdating(false);
      },
      (error) => {
        console.error("Manual location update error:", error);
        setIsUpdating(false);

        // Handle manual update errors
        let errorMessage = "Manual location update failed";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location permission denied. Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please check GPS signal.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        console.warn("Manual location update error:", errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Force fresh location
      }
    );
  };

  if (mapError) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Map Unavailable
            </h3>
            <p className="text-gray-600 mb-4">{mapError}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Location Map
          </CardTitle>
          <div className="flex items-center gap-2">
            {isTracking && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Live Tracking
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualUpdate}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`}
              />
              Update
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-80 rounded-b-lg"
            style={{ minHeight: "320px" }}
          />

          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-100 rounded-b-lg flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          )}

          {locationData && (
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Current Location</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Lat: {locationData.latitude.toFixed(6)}</div>
                <div>Lng: {locationData.longitude.toFixed(6)}</div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(locationData.timestamp).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />±
                  {Math.round(locationData.accuracy)}m accuracy
                </div>
              </div>
            </div>
          )}

          {/* Accuracy Warning */}
          {accuracyIssue && (
            <div className="absolute top-4 right-4 bg-red-500 text-white rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1">
                    Location Accuracy Issue
                  </h3>
                  <p className="text-sm opacity-90 mb-2">
                    Your location accuracy is poor (
                    {locationData ? Math.round(locationData.accuracy) : 0}m).
                    Please check your phone's GPS settings and do not use
                    laptop.
                  </p>
                  {accuracyWarningTime && (
                    <p className="text-xs opacity-75 mb-2">
                      Auto-logout in{" "}
                      {Math.max(
                        0,
                        Math.round(
                          (10 * 60 * 1000 -
                            (Date.now() - accuracyWarningTime)) /
                            1000 /
                            60
                        )
                      )}{" "}
                      minutes if not resolved.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setShowTroubleshooting(!showTroubleshooting)
                      }
                      className="text-xs"
                    >
                      Help
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleManualUpdate}
                      className="text-xs border-white/30 text-white hover:bg-white/10"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Troubleshooting Modal */}
          {showTroubleshooting && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Location Troubleshooting
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTroubleshooting(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        How to fix location accuracy:
                      </h4>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Go to your phone's Settings</li>
                        <li>Find Location/GPS settings</li>
                        <li>Enable High Accuracy mode</li>
                        <li>Allow location access for TownKart</li>
                        <li>
                          Go outside or near a window for better GPS signal
                        </li>
                        <li>
                          Do not use laptop - location works best on mobile
                          phones
                        </li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">
                        Important Notes:
                      </h4>
                      <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                        <li>Location must be accurate within 10 meters</li>
                        <li>
                          You will be automatically logged out after 10 minutes
                          of poor accuracy
                        </li>
                        <li>
                          Your status will be set to inactive until location is
                          fixed
                        </li>
                        <li>
                          This is required for safe and accurate deliveries
                        </li>
                      </ul>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">
                        Need Help?
                      </h4>
                      <div className="space-y-2 text-sm text-green-800">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>
                            Call Support:{" "}
                            <a href="tel:9784740736" className="font-medium">
                              9784740736
                            </a>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>
                            Email:{" "}
                            <a
                              href="mailto:location@townkart.com"
                              className="font-medium"
                            >
                              location@townkart.com
                            </a>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button
                      onClick={handleManualUpdate}
                      className="flex-1 bg-townkart-primary hover:bg-townkart-primary/90"
                    >
                      Test Location Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowTroubleshooting(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isUpdating && (
            <div className="absolute top-4 right-4 bg-blue-500 text-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Updating...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
