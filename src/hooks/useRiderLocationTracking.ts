"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  locationService,
  LocationData,
  RiderLocationTrackingOptions,
} from "@/services/location.service";
import { useAuth } from "@/hooks/useAuth";

export interface RiderLocationTrackingHookOptions {
  updateInterval?: number; // milliseconds
  backgroundEnabled?: boolean;
  batteryOptimizationWarning?: boolean;
  spoofingDetection?: boolean;
  autoStart?: boolean;
  onLocationUpdate?: (location: LocationData) => void;
  onError?: (error: Error) => void;
  onPermissionRevoked?: () => void;
}

export function useRiderLocationTracking(
  options: RiderLocationTrackingHookOptions = {},
) {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [lastServerUpdate, setLastServerUpdate] = useState<Date | null>(null);
  const [updateStreak, setUpdateStreak] = useState(0);

  const trackingOptions: RiderLocationTrackingOptions = {
    updateInterval: options.updateInterval || 30000, // 30 seconds
    backgroundEnabled: options.backgroundEnabled ?? true,
    batteryOptimizationWarning: options.batteryOptimizationWarning ?? true,
    spoofingDetection: options.spoofingDetection ?? true,
  };

  const serverUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingServerRef = useRef(false);

  // Send location to server
  const sendLocationToServer = useCallback(
    async (location: LocationData) => {
      if (!user?.id || isUpdatingServerRef.current) return;

      try {
        isUpdatingServerRef.current = true;

        const response = await fetch("/api/riders/location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            speed: location.speed,
            heading: location.heading,
            altitude: location.altitude,
            batteryLevel: (navigator as any).getBattery
              ? await (navigator as any)
                  .getBattery()
                  .then((b: any) => b.level * 100)
              : undefined,
            activity: "moving", // Could be enhanced with activity detection
          }),
        });

        const result = await response.json();

        if (result.success) {
          setLastServerUpdate(new Date());
          setUpdateStreak((prev) => prev + 1);
          setError(null);
        } else {
          throw new Error(result.message || "Failed to update location");
        }
      } catch (err) {
        console.error("Error sending location to server:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to sync location";
        setError(errorMessage);
        options.onError?.(new Error(errorMessage));
      } finally {
        isUpdatingServerRef.current = false;
      }
    },
    [user?.id, options],
  );

  // Handle location updates
  const handleLocationUpdate = useCallback(
    (location: LocationData) => {
      setCurrentLocation(location);
      options.onLocationUpdate?.(location);

      // Send to server (throttled)
      sendLocationToServer(location);
    },
    [options, sendLocationToServer],
  );

  // Handle tracking errors
  const handleTrackingError = useCallback(
    (error: Error) => {
      console.error("Location tracking error:", error);
      setError(error.message);
      options.onError?.(error);

      if (error.message.includes("permission")) {
        options.onPermissionRevoked?.();
      }
    },
    [options],
  );

  // Start tracking
  const startTracking = useCallback(() => {
    if (isTracking || !user?.id) return;

    setIsTracking(true);
    setError(null);

    locationService.startLocationTracking(
      trackingOptions,
      handleLocationUpdate,
      handleTrackingError,
    );
  }, [
    isTracking,
    user?.id,
    trackingOptions,
    handleLocationUpdate,
    handleTrackingError,
  ]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    locationService.stopLocationTracking();
    setIsTracking(false);

    if (serverUpdateIntervalRef.current) {
      clearInterval(serverUpdateIntervalRef.current);
    }
  }, []);

  // Get current location once
  const getCurrentLocation = useCallback(async () => {
    try {
      setError(null);
      const location = await locationService.requestLocation();
      setCurrentLocation(location);
      await sendLocationToServer(location);
      return location;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get location";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [sendLocationToServer]);

  // Initialize tracking if autoStart is enabled
  useEffect(() => {
    if (options.autoStart && user?.id && !isTracking) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [options.autoStart, user?.id, isTracking, startTracking, stopTracking]);

  // Periodic server sync (fallback if location updates are missed)
  useEffect(() => {
    if (isTracking && currentLocation) {
      serverUpdateIntervalRef.current = setInterval(() => {
        sendLocationToServer(currentLocation);
      }, trackingOptions.updateInterval * 2); // Sync every 2 update intervals
    }

    return () => {
      if (serverUpdateIntervalRef.current) {
        clearInterval(serverUpdateIntervalRef.current);
      }
    };
  }, [
    isTracking,
    currentLocation,
    trackingOptions.updateInterval,
    sendLocationToServer,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    isTracking,
    currentLocation,
    error,
    lastServerUpdate,
    updateStreak,
    startTracking,
    stopTracking,
    getCurrentLocation,
    sendLocationToServer,
  };
}
