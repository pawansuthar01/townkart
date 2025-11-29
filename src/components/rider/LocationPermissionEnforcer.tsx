"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  AlertTriangle,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Battery,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  locationService,
  LocationData,
  LocationPermissionStatus,
  RiderLocationTrackingOptions,
} from "@/services/location.service";
import { useAuth } from "@/hooks/useAuth";

export interface LocationPermissionEnforcerProps {
  onLocationAvailable?: (location: LocationData) => void;
  onLocationLost?: () => void;
  onPermissionRevoked?: () => void;
  onBatteryWarning?: () => void;
  onSpoofingDetected?: () => void;
  className?: string;
  enforceStrictMode?: boolean; // If true, blocks app usage without location
}

export function LocationPermissionEnforcer({
  onLocationAvailable,
  onLocationLost,
  onPermissionRevoked,
  onBatteryWarning,
  onSpoofingDetected,
  className = "",
  enforceStrictMode = true,
}: LocationPermissionEnforcerProps) {
  const { user } = useAuth();
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [lastLocationTime, setLastLocationTime] = useState<Date | null>(null);
  const [locationTimeoutWarning, setLocationTimeoutWarning] = useState(false);
  const [batteryWarningShown, setBatteryWarningShown] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [locationStreak, setLocationStreak] = useState(0); // Consecutive successful location updates

  const trackingOptions: RiderLocationTrackingOptions = {
    updateInterval: 30000, // 30 seconds
    backgroundEnabled: true,
    batteryOptimizationWarning: true,
    spoofingDetection: true,
  };

  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const permissionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check initial permission and start tracking if possible
  useEffect(() => {
    const initializeLocationTracking = async () => {
      try {
        const status = await locationService.checkPermission();
        setPermissionStatus(status);

        if (status.granted) {
          startLocationTracking();
        } else if (enforceStrictMode) {
          setError(
            "Location permission is required to continue using the rider app",
          );
          onPermissionRevoked?.();
        }
      } catch (err) {
        console.error("Error initializing location tracking:", err);
        setError("Failed to initialize location services");
      }
    };

    initializeLocationTracking();

    // Periodic permission check every 5 minutes
    permissionCheckIntervalRef.current = setInterval(
      async () => {
        try {
          const status = await locationService.checkPermission();
          if (permissionStatus?.granted && !status.granted) {
            // Permission was revoked
            stopLocationTracking();
            setPermissionStatus(status);
            setError("Location permission has been revoked");
            onPermissionRevoked?.();
          }
        } catch (err) {
          console.error("Error checking permission:", err);
        }
      },
      5 * 60 * 1000,
    ); // 5 minutes

    // Listen for permission changes
    const unsubscribe = locationService.onPermissionChange((status) => {
      setPermissionStatus(status);
      if (!status.granted && enforceStrictMode) {
        stopLocationTracking();
        setError(
          "Location permission is required to continue using the rider app",
        );
        onPermissionRevoked?.();
      } else if (status.granted && !isTracking) {
        startLocationTracking();
      }
    });

    return () => {
      stopLocationTracking();
      if (permissionCheckIntervalRef.current) {
        clearInterval(permissionCheckIntervalRef.current);
      }
      unsubscribe();
    };
  }, [enforceStrictMode, onPermissionRevoked]);

  // Location timeout monitoring
  useEffect(() => {
    if (isTracking && lastLocationTime) {
      const checkTimeout = () => {
        const now = new Date();
        const timeSinceLastLocation =
          now.getTime() - lastLocationTime.getTime();
        const timeoutThreshold = 5 * 60 * 1000; // 5 minutes
        const criticalThreshold = 10 * 60 * 1000; // 10 minutes

        if (timeSinceLastLocation > criticalThreshold) {
          // Critical: auto-logout or reassign
          setError(
            "Location tracking has been lost for too long. Please check your GPS and network connection.",
          );
          onLocationLost?.();
          if (enforceStrictMode) {
            // Trigger auto-logout or delivery reassignment
            handleCriticalLocationLoss();
          }
        } else if (timeSinceLastLocation > timeoutThreshold) {
          setLocationTimeoutWarning(true);
          setError("Location updates delayed. Please check your GPS signal.");
        } else {
          setLocationTimeoutWarning(false);
          setError(null);
        }
      };

      locationTimeoutRef.current = setInterval(checkTimeout, 60000); // Check every minute

      return () => {
        if (locationTimeoutRef.current) {
          clearInterval(locationTimeoutRef.current);
        }
      };
    }
  }, [isTracking, lastLocationTime, enforceStrictMode, onLocationLost]);

  const startLocationTracking = useCallback(() => {
    if (isTracking) return;

    setIsTracking(true);
    setError(null);

    locationService.startLocationTracking(
      trackingOptions,
      (location) => {
        setCurrentLocation(location);
        setLastLocationTime(new Date());
        setLocationStreak((prev) => prev + 1);
        onLocationAvailable?.(location);
      },
      (error) => {
        console.error("Location tracking error:", error);
        setError(error.message);

        if (error.message.includes("spoofing")) {
          onSpoofingDetected?.();
        } else if (error.message.includes("permission")) {
          onPermissionRevoked?.();
        } else {
          onLocationLost?.();
        }
      },
    );
  }, [
    isTracking,
    trackingOptions,
    onLocationAvailable,
    onSpoofingDetected,
    onPermissionRevoked,
    onLocationLost,
  ]);

  const stopLocationTracking = useCallback(() => {
    locationService.stopLocationTracking();
    setIsTracking(false);
    if (locationTimeoutRef.current) {
      clearInterval(locationTimeoutRef.current);
    }
  }, []);

  const handleCriticalLocationLoss = async () => {
    // In a real app, this would trigger:
    // 1. Auto-logout the rider
    // 2. Reassign active deliveries
    // 3. Notify admin
    // 4. Send alert to rider

    console.error(
      "Critical location loss detected - triggering emergency protocols",
    );

    // For now, just show critical error
    setError(
      "CRITICAL: GPS signal lost. Rider app access suspended until location is restored.",
    );
  };

  const requestPermission = async () => {
    try {
      setError(null);
      await locationService.requestLocation();
      const status = await locationService.checkPermission();
      setPermissionStatus(status);

      if (status.granted) {
        startLocationTracking();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to get location permission";
      setError(errorMessage);
    }
  };

  const getStatusDisplay = () => {
    if (!permissionStatus) return null;

    if (permissionStatus.granted && isTracking && currentLocation) {
      const timeSinceUpdate = lastLocationTime
        ? new Date().getTime() - lastLocationTime.getTime()
        : Infinity;

      const isRecent = timeSinceUpdate < 60000; // 1 minute

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-700">
              Location tracking active
            </span>
            {isRecent && (
              <Badge variant="secondary" className="text-xs">
                Live
              </Badge>
            )}
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <div>Last update: {lastLocationTime?.toLocaleTimeString()}</div>
            <div>
              Accuracy:{" "}
              {currentLocation.accuracy
                ? `${Math.round(currentLocation.accuracy)}m`
                : "Unknown"}
            </div>
            <div>Streak: {locationStreak} updates</div>
          </div>
        </div>
      );
    }

    if (permissionStatus.denied) {
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">
            Location permission denied
          </span>
        </div>
      );
    }

    if (permissionStatus.prompt) {
      return (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-yellow-700">
            Location permission required
          </span>
        </div>
      );
    }

    return null;
  };

  const getConnectionStatus = () => {
    const indicators = [];

    // Network status
    indicators.push(
      <div key="network" className="flex items-center gap-1">
        {networkStatus ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
        <span className="text-xs">{networkStatus ? "Online" : "Offline"}</span>
      </div>,
    );

    // GPS status
    if (isTracking) {
      indicators.push(
        <div key="gps" className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-green-500" />
          <span className="text-xs">GPS Active</span>
        </div>,
      );
    }

    // Battery warning
    if (batteryWarningShown) {
      indicators.push(
        <div key="battery" className="flex items-center gap-1">
          <Battery className="h-3 w-3 text-yellow-500" />
          <span className="text-xs">Battery Warning</span>
        </div>,
      );
    }

    return indicators;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Tracking Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {getStatusDisplay()}

        {/* Connection Indicators */}
        <div className="flex flex-wrap gap-3 text-xs">
          {getConnectionStatus()}
        </div>

        {/* Progress for location streak */}
        {isTracking && locationStreak > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Location Update Streak</span>
              <span>{locationStreak}</span>
            </div>
            <Progress
              value={Math.min(locationStreak * 10, 100)}
              className="h-2"
            />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant={locationTimeoutWarning ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Permission Request */}
        {permissionStatus?.prompt && !isTracking && (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Location access is mandatory for delivery riders. This allows us
                to:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Track your location during deliveries</li>
                  <li>Assign nearby orders efficiently</li>
                  <li>Ensure customer safety and order accuracy</li>
                  <li>Provide real-time ETAs</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={requestPermission}
              className="w-full"
              disabled={!networkStatus}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Enable Location Tracking
            </Button>
          </div>
        )}

        {/* Permission Instructions */}
        {permissionStatus?.denied && (
          <div className="space-y-3">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>
                    Location permission is required to use the rider app. To
                    enable:
                  </p>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>iOS:</strong> Settings → Privacy & Security →
                      Location Services → [Browser] → Allow
                    </p>
                    <p>
                      <strong>Android:</strong> Settings → Apps → [Browser] →
                      Permissions → Location → Allow
                    </p>
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Note: "Allow all the time" permission may be required for
                    background tracking.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              onClick={requestPermission}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Permission Again
            </Button>
          </div>
        )}

        {/* Battery Optimization Warning */}
        {batteryWarningShown && (
          <Alert>
            <Battery className="h-4 w-4" />
            <AlertDescription>
              Battery optimization may be affecting location accuracy. For best
              performance:
              <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                <li>Disable battery optimization for this app</li>
                <li>Keep GPS/location services enabled</li>
                <li>Ensure background app refresh is allowed</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Network Warning */}
        {!networkStatus && (
          <Alert>
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              No internet connection detected. Location tracking requires
              network access for real-time updates.
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === "development" && currentLocation && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div>Lat: {currentLocation.latitude.toFixed(6)}</div>
            <div>Lng: {currentLocation.longitude.toFixed(6)}</div>
            <div>Accuracy: {currentLocation.accuracy}m</div>
            <div>Speed: {currentLocation.speed?.toFixed(1)} m/s</div>
            <div>
              Timestamp: {new Date(currentLocation.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
