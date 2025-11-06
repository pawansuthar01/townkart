import { useState, useEffect, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    error: null,
    isLoading: false,
    isSupported: typeof navigator !== "undefined" && "geolocation" in navigator,
  });

  const getCurrentPosition = useCallback(() => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by this browser",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
      ...options,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          error: null,
          isLoading: false,
          isSupported: true,
        });
      },
      (error) => {
        let errorMessage = "Unknown error occurred";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "User denied the request for geolocation";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out";
            break;
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      },
      defaultOptions,
    );
  }, [state.isSupported, options]);

  const watchPosition = useCallback(() => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by this browser",
      }));
      return null;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000, // 1 second
      ...options,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          error: null,
          isLoading: false,
          isSupported: true,
        });
      },
      (error) => {
        let errorMessage = "Unknown error occurred";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "User denied the request for geolocation";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out";
            break;
        }

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      },
      defaultOptions,
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [state.isSupported, options]);

  const clearPosition = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      error: null,
      isLoading: false,
      isSupported: state.isSupported,
    });
  }, [state.isSupported]);

  // Request permission explicitly
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state === "granted";
    } catch {
      // Fallback for browsers that don't support permissions API
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 1000 },
        );
      });
    }
  }, [state.isSupported]);

  // Calculate distance between two points
  const calculateDistance = useCallback(
    (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371; // Radius of the Earth in kilometers
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in kilometers
    },
    [],
  );

  // Get address from coordinates (reverse geocoding)
  const getAddressFromCoordinates = useCallback(
    async (latitude: number, longitude: number): Promise<any> => {
      try {
        // Using a free geocoding service or you can integrate with Google Maps
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        );
        const data = await response.json();
        return {
          address:
            data.localityInfo?.administrative?.[2]?.name ||
            data.city ||
            "Unknown",
          city: data.city || "Unknown",
          state: data.principalSubdivision || "Unknown",
          country: data.countryName || "Unknown",
          postalCode: data.postcode || "Unknown",
        };
      } catch (error) {
        console.error("Reverse geocoding failed:", error);
        return null;
      }
    },
    [],
  );

  return {
    // State
    ...state,

    // Actions
    getCurrentPosition,
    watchPosition,
    clearPosition,
    requestPermission,

    // Utilities
    calculateDistance,
    getAddressFromCoordinates,
  };
};
