"use client";

import { useState, useEffect, useCallback } from "react";
import LocationService, {
  LocationData,
  DeliveryZone,
} from "@/lib/locationService";

interface UseLocationReturn {
  location: LocationData | null;
  permissionStatus: PermissionState | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<void>;
  reverseGeocode: (lat: number, lng: number) => Promise<LocationData>;
  findDeliveryZone: (lat: number, lng: number) => Promise<DeliveryZone | null>;
  calculateDeliveryFee: (
    userLat: number,
    userLng: number,
    storeLat: number,
    storeLng: number
  ) => number;
  isLocationServiced: (lat: number, lng: number) => Promise<boolean>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check geolocation permission status
  const checkPermissionStatus = useCallback(async () => {
    if (!navigator.permissions) return;

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setPermissionStatus(result.state);

      // Listen for permission changes
      result.addEventListener("change", () => {
        setPermissionStatus(result.state);
      });
    } catch (err) {
      console.warn("Could not check geolocation permission:", err);
    }
  }, []);

  // Request user's location
  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const locationData = await LocationService.getCurrentLocation();
      setLocation(locationData);

      // Try to reverse geocode for address
      try {
        const geocodedLocation = await LocationService.reverseGeocode(
          locationData.latitude,
          locationData.longitude
        );
        setLocation(geocodedLocation);
      } catch (geocodeError) {
        console.warn("Reverse geocoding failed:", geocodeError);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reverse geocode coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    return await LocationService.reverseGeocode(lat, lng);
  }, []);

  // Find delivery zone for location
  const findDeliveryZone = useCallback(async (lat: number, lng: number) => {
    return await LocationService.findBestDeliveryZone(lat, lng);
  }, []);

  // Calculate delivery fee
  const calculateDeliveryFee = useCallback(
    (userLat: number, userLng: number, storeLat: number, storeLng: number) => {
      return LocationService.calculateDeliveryFee(
        userLat,
        userLng,
        storeLat,
        storeLng
      );
    },
    []
  );

  // Check if location is serviced
  const isLocationServiced = useCallback(async (lat: number, lng: number) => {
    return await LocationService.isLocationServiced(lat, lng);
  }, []);

  // Initialize permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  return {
    location,
    permissionStatus,
    isLoading,
    error,
    requestLocation,
    reverseGeocode,
    findDeliveryZone,
    calculateDeliveryFee,
    isLocationServiced,
  };
}

export default useLocation;
