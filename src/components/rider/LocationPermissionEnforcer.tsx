"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  MapPin,
  RefreshCw,
  X,
  Clock,
  Battery,
  Wifi,
  WifiOff,
  Shield,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resilientLocationService } from "@/services/resilient-location.service";

interface LocationStatus {
  hasPermission: boolean;
  isEnabled: boolean;
  accuracy: number | null;
  lastUpdate: Date | null;
  error: string | null;
  batteryLevel: number;
  isOnline: boolean;
}

interface LocationPermissionEnforcerProps {
  onLocationUpdate?: (location: any) => void;
  requireContinuousTracking?: boolean;
  onPermissionDenied?: () => void;
  onLocationLost?: () => void;
  className?: string;
}

export function LocationPermissionEnforcer({
  onLocationUpdate,
  requireContinuousTracking = false,
  onPermissionDenied,
  onLocationLost,
  className = "",
}: LocationPermissionEnforcerProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [locationStatus, setLocationStatus] = useState<LocationStatus>({
    hasPermission: false,
    isEnabled: false,
    accuracy: null,
    lastUpdate: null,
    error: null,
    batteryLevel: 100,
    isOnline: navigator.onLine,
  });

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showLocationLostDialog, setShowLocationLostDialog] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  const permissionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationStateUnsubscribeRef = useRef<(() => void) | null>(null);

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
    setupPermissionMonitoring();
    setupBatteryMonitoring();
    setupResilientLocationTracking();

    return () => {
      cleanup();
    };
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () =>
      setLocationStatus((prev) => ({ ...prev, isOnline: true }));
    const handleOffline = () =>
      setLocationStatus((prev) => ({ ...prev, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const setupPermissionMonitoring = () => {
    // Check permissions every 30 seconds
    permissionCheckIntervalRef.current = setInterval(() => {
      checkLocationPermission();
    }, 30000);
  };

  const setupBatteryMonitoring = () => {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setLocationStatus((prev) => ({
          ...prev,
          batteryLevel: Math.round(battery.level * 100),
        }));

        battery.addEventListener("levelchange", () => {
          setLocationStatus((prev) => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100),
          }));
        });
      });
    }
  };

  const setupResilientLocationTracking = () => {
    // Subscribe to resilient location service state changes
    locationStateUnsubscribeRef.current =
      resilientLocationService.onStateChange((state) => {
        setLocationStatus((prev) => ({
          ...prev,
          isOnline: state.isOnline,
        }));
      });

    // Configure the resilient service
    resilientLocationService.configure({
      maxRetries: 5,
      initialBackoffDelay: 1000,
      maxBackoffDelay: 30000,
      offlineQueueSize: 100,
      syncInterval: 30000,
      enableBackgroundSync: true,
    });
  };

  const checkLocationPermission = async () => {
    setIsCheckingPermission(true);

    try {
      if (!navigator.permissions) {
        // Fallback for browsers without permissions API
        setLocationStatus((prev) => ({
          ...prev,
          hasPermission: "geolocation" in navigator,
          error: null,
        }));
        return;
      }

      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      setLocationStatus((prev) => ({
        ...prev,
        hasPermission: permission.state === "granted",
        error:
          permission.state === "denied" ? "Location permission denied" : null,
      }));

      if (permission.state === "denied") {
        handlePermissionDenied();
      }

      // Listen for permission changes
      permission.addEventListener("change", () => {
        setLocationStatus((prev) => ({
          ...prev,
          hasPermission: permission.state === "granted",
          error:
            permission.state === "denied" ? "Location permission denied" : null,
        }));

        if (permission.state === "denied") {
          handlePermissionDenied();
        }
      });
    } catch (error) {
      console.error("Error checking location permission:", error);
      setLocationStatus((prev) => ({
        ...prev,
        error: "Unable to check location permissions",
      }));
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const handlePermissionDenied = () => {
    setShowPermissionDialog(true);
    onPermissionDenied?.();

    // Log permission denial
    logLocationEvent("permission_denied", {
      userId: user?.id,
      timestamp: new Date().toISOString(),
    });
  };

  const requestLocationPermission = async () => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      setLocationStatus((prev) => ({
        ...prev,
        hasPermission: true,
        isEnabled: true,
        accuracy: position.coords.accuracy,
        lastUpdate: new Date(),
        error: null,
      }));

      setShowPermissionDialog(false);
      startLocationTracking();
    } catch (error: any) {
      console.error("Error requesting location permission:", error);

      let errorMessage = "Unable to access location";
      if (error.code === error.PERMISSION_DENIED) {
        errorMessage =
          "Location permission denied. Please enable location access in your browser settings.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage =
          "Location information is unavailable. Please check your GPS settings.";
      } else if (error.code === error.TIMEOUT) {
        errorMessage = "Location request timed out. Please try again.";
      }

      setLocationStatus((prev) => ({
        ...prev,
        error: errorMessage,
      }));

      // If permission is still denied after request, show enforcement dialog
      if (error.code === error.PERMISSION_DENIED) {
        setShowPermissionDialog(true);
      }
    }
  };

  const startLocationTracking = async () => {
    try {
      await resilientLocationService.startResilientTracking(
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: requireContinuousTracking ? 10000 : 30000,
        },
        (location) => {
          // Handle successful location updates
          setLocationStatus((prev) => ({
            ...prev,
            isEnabled: true,
            accuracy: location.accuracy,
            lastUpdate: new Date(),
            error: null,
          }));

          onLocationUpdate?.(location);
          setShowLocationLostDialog(false);
        },
        (error) => {
          // Handle location errors
          console.error("Resilient location tracking error:", error);

          let errorMessage = "Location tracking failed";
          if (error.message.includes("permission")) {
            errorMessage = "Location permission revoked";
            handlePermissionDenied();
          } else if (error.message.includes("unavailable")) {
            errorMessage = "GPS signal lost";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Location request timed out";
          }

          setLocationStatus((prev) => ({
            ...prev,
            error: errorMessage,
          }));

          // Check if we should show location lost dialog
          const state = resilientLocationService.getState();
          if (state.retryCount >= 3) {
            handleLocationLost();
          }
        }
      );

      // Set timeout for continuous tracking
      if (requireContinuousTracking) {
        setTimeout(() => {
          const state = resilientLocationService.getState();
          if (
            !state.lastSuccessfulSync ||
            Date.now() - state.lastSuccessfulSync.getTime() > 60000
          ) {
            handleLocationLost();
          }
        }, 60000);
      }
    } catch (error) {
      console.error("Failed to start resilient location tracking:", error);
      setLocationStatus((prev) => ({
        ...prev,
        error: "Failed to start location tracking",
      }));
    }
  };

  const handleLocationLost = () => {
    setShowLocationLostDialog(true);
    onLocationLost?.();

    const state = resilientLocationService.getState();
    logLocationEvent("location_lost", {
      userId: user?.id,
      lastSuccessfulSync: state.lastSuccessfulSync,
      retryCount: state.retryCount,
      pendingLocationsCount: state.pendingLocations.length,
      timestamp: new Date().toISOString(),
    });

    // For active deliveries, this should trigger auto-reassign or logout
    if (requireContinuousTracking) {
      // Trigger emergency protocols
      triggerEmergencyProtocol();
    }
  };

  const triggerEmergencyProtocol = async () => {
    try {
      const state = resilientLocationService.getState();

      // Notify admin
      await fetch("/api/admin/rider-location-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderId: user?.id,
          alertType: "gps_lost_during_delivery",
          lastSuccessfulSync: state.lastSuccessfulSync,
          pendingLocationsCount: state.pendingLocations.length,
          timestamp: new Date().toISOString(),
        }),
      });

      // Auto-logout after 5 minutes of no location
      setTimeout(async () => {
        const currentState = resilientLocationService.getState();
        if (
          !currentState.lastSuccessfulSync ||
          Date.now() - currentState.lastSuccessfulSync.getTime() > 300000
        ) {
          await logout();
          router.push("/auth/login?reason=gps_required");
        }
      }, 300000); // 5 minutes
    } catch (error) {
      console.error("Error triggering emergency protocol:", error);
    }
  };

  const logLocationEvent = async (eventType: string, data: any) => {
    try {
      await fetch("/api/riders/location/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, ...data }),
      });
    } catch (error) {
      console.error("Error logging location event:", error);
    }
  };

  const cleanup = () => {
    // Stop resilient location tracking
    resilientLocationService.stopResilientTracking();

    // Unsubscribe from state changes
    if (locationStateUnsubscribeRef.current) {
      locationStateUnsubscribeRef.current();
      locationStateUnsubscribeRef.current = null;
    }

    if (permissionCheckIntervalRef.current) {
      clearInterval(permissionCheckIntervalRef.current);
      permissionCheckIntervalRef.current = null;
    }
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (!accuracy) return "text-gray-500";
    if (accuracy <= 10) return "text-green-600";
    if (accuracy <= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getBatteryColor = (level: number) => {
    if (level >= 50) return "text-green-600";
    if (level >= 20) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <>
      {/* Permission Required Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="h-5 w-5" />
                Location Access Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Location access is mandatory for delivery riders. This allows
                  us to:
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>Assign you to nearby delivery requests</li>
                    <li>Track your location during deliveries</li>
                    <li>Ensure customer safety and order accuracy</li>
                    <li>Calculate accurate delivery times</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={requestLocationPermission} className="flex-1">
                  Enable Location Access
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPermissionDialog(false)}
                  className="flex-1"
                >
                  Try Again Later
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Without location access, you cannot go online or accept
                deliveries.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location Lost Dialog */}
      {showLocationLostDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                GPS Signal Lost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your GPS signal has been lost. This may affect delivery
                  assignments and tracking.
                  {requireContinuousTracking &&
                    " Active deliveries require continuous GPS tracking."}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Network Status</p>
                  <div className="flex items-center gap-1">
                    {locationStatus.isOnline ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span>
                      {locationStatus.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600">Battery Level</p>
                  <span
                    className={getBatteryColor(locationStatus.batteryLevel)}
                  >
                    {locationStatus.batteryLevel}%
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowLocationLostDialog(false);
                    requestLocationPermission();
                  }}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry GPS
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLocationLostDialog(false)}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>

              {requireContinuousTracking && (
                <p className="text-xs text-red-600 text-center">
                  ⚠️ GPS required for active delivery. System will auto-logout
                  in 5 minutes if unresolved.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Indicator */}
      <div className={`p-3 rounded-lg border ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                locationStatus.hasPermission && locationStatus.isEnabled
                  ? "bg-green-500 animate-pulse"
                  : locationStatus.hasPermission
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />

            <div>
              <p className="text-sm font-medium">
                {locationStatus.hasPermission && locationStatus.isEnabled
                  ? "GPS Active"
                  : locationStatus.hasPermission
                    ? "GPS Available"
                    : "GPS Required"}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                {locationStatus.accuracy && (
                  <span className={getAccuracyColor(locationStatus.accuracy)}>
                    ±{Math.round(locationStatus.accuracy)}m
                  </span>
                )}
                {locationStatus.lastUpdate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(locationStatus.lastUpdate).toLocaleTimeString()}
                  </span>
                )}
                <span className={getBatteryColor(locationStatus.batteryLevel)}>
                  <Battery className="h-3 w-3 inline mr-1" />
                  {locationStatus.batteryLevel}%
                </span>
              </div>
            </div>
          </div>

          {isCheckingPermission && (
            <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {locationStatus.error && (
          <Alert className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {locationStatus.error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
}
