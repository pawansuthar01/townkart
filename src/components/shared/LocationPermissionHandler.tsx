"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  AlertTriangle,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  locationService,
  LocationData,
  LocationPermissionStatus,
} from "@/services/location.service";

export interface LocationPermissionHandlerProps {
  onLocationGranted?: (location: LocationData) => void;
  onLocationDenied?: () => void;
  onManualEntry?: () => void;
  showAccuracyWarning?: boolean;
  autoRequest?: boolean;
  className?: string;
}

export function LocationPermissionHandler({
  onLocationGranted,
  onLocationDenied,
  onManualEntry,
  showAccuracyWarning = true,
  autoRequest = false,
  className = "",
}: LocationPermissionHandlerProps) {
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [accuracyWarning, setAccuracyWarning] = useState<string | null>(null);

  // Check initial permission status
  useEffect(() => {
    const checkInitialPermission = async () => {
      try {
        const status = await locationService.checkPermission();
        setPermissionStatus(status);

        if (status.granted && autoRequest) {
          requestLocation();
        }
      } catch (err) {
        console.error("Error checking permission:", err);
        setError("Failed to check location permissions");
      }
    };

    checkInitialPermission();

    // Listen for permission changes
    const unsubscribe = locationService.onPermissionChange((status) => {
      setPermissionStatus(status);
      if (status.denied) {
        setShowManualFallback(true);
        onLocationDenied?.();
      }
    });

    return unsubscribe;
  }, [autoRequest, onLocationDenied]);

  // Request location permission and get position
  const requestLocation = useCallback(async () => {
    setIsRequesting(true);
    setError(null);
    setAccuracyWarning(null);

    try {
      const locationData = await locationService.requestLocation({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      setLocation(locationData);

      // Check accuracy and show warning if needed
      if (
        showAccuracyWarning &&
        locationData.accuracy &&
        locationData.accuracy > 100
      ) {
        setAccuracyWarning(
          `Location accuracy is low (${Math.round(locationData.accuracy)}m). ETA calculations may be less accurate.`,
        );
      }

      onLocationGranted?.(locationData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get location";
      setError(errorMessage);

      if (errorMessage.includes("denied")) {
        setShowManualFallback(true);
        onLocationDenied?.();
      }
    } finally {
      setIsRequesting(false);
    }
  }, [showAccuracyWarning, onLocationGranted, onLocationDenied]);

  // Handle manual address entry
  const handleManualEntry = () => {
    setShowManualFallback(false);
    onManualEntry?.();
  };

  // Get status display
  const getStatusDisplay = () => {
    if (!permissionStatus) return null;

    if (permissionStatus.granted && location) {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-700">Location detected</span>
          <Badge variant="secondary" className="text-xs">
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Badge>
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
            Location permission needed
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {getStatusDisplay()}

        {/* Permission Request */}
        {permissionStatus?.prompt && !location && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Enable location access to automatically detect your address and
              get accurate delivery estimates.
            </p>
            <Button
              onClick={requestLocation}
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Allow Location Access
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Accuracy Warning */}
        {accuracyWarning && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{accuracyWarning}</AlertDescription>
          </Alert>
        )}

        {/* Manual Fallback */}
        {showManualFallback && (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Location access is required for accurate delivery estimates.
                Without it, ETAs may be less precise.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={requestLocation}
                disabled={isRequesting}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={handleManualEntry} className="flex-1">
                Enter Address Manually
              </Button>
            </div>
          </div>
        )}

        {/* Permission Instructions */}
        {permissionStatus?.denied && (
          <div className="space-y-3">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>To enable location access:</p>
                  <ol className="list-decimal list-inside text-xs space-y-1">
                    <li>Go to your browser settings</li>
                    <li>Find site permissions or location settings</li>
                    <li>Allow location access for this site</li>
                    <li>Refresh the page and try again</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              onClick={handleManualEntry}
              className="w-full"
            >
              Continue with Manual Address Entry
            </Button>
          </div>
        )}

        {/* Retry Button */}
        {location && (
          <Button
            variant="outline"
            size="sm"
            onClick={requestLocation}
            disabled={isRequesting}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Location
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for using location permission handler
export function useLocationPermission(
  options: {
    autoRequest?: boolean;
    onGranted?: (location: LocationData) => void;
    onDenied?: () => void;
  } = {},
) {
  const [status, setStatus] = useState<LocationPermissionStatus | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permissionStatus = await locationService.checkPermission();
        setStatus(permissionStatus);

        if (permissionStatus.granted && options.autoRequest) {
          const locationData = await locationService.requestLocation();
          setLocation(locationData);
          options.onGranted?.(locationData);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Permission check failed",
        );
        options.onDenied?.();
      }
    };

    checkPermission();

    const unsubscribe = locationService.onPermissionChange((newStatus) => {
      setStatus(newStatus);
      if (newStatus.denied) {
        options.onDenied?.();
      }
    });

    return unsubscribe;
  }, [options]);

  const requestLocation = async () => {
    try {
      setError(null);
      const locationData = await locationService.requestLocation();
      setLocation(locationData);
      options.onGranted?.(locationData);
      return locationData;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get location";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    status,
    location,
    error,
    requestLocation,
  };
}
