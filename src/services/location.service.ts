import { RiderLocation, DeliveryZone, ServiceArea } from "@/types/api.types";

export interface LocationPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  unavailable: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number | string;

  speed?: number;
  heading?: number;
  altitude?: number;
}

export interface LocationPermissionOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  background?: boolean;
  maxAccuracy?: number; // Maximum acceptable accuracy in meters
}

export interface RiderLocationTrackingOptions {
  updateInterval: number; // in milliseconds
  backgroundEnabled: boolean;
  batteryOptimizationWarning: boolean;
  spoofingDetection: boolean;
}

export interface CustomerLocationOptions {
  autoDetect: boolean;
  fallbackToManual: boolean;
  showAccuracyWarning: boolean;
}

export class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private permissionStatus: LocationPermissionStatus | null = null;
  private lastLocation: LocationData | null = null;
  private locationCallbacks: ((location: LocationData) => void)[] = [];
  private permissionCallbacks: ((status: LocationPermissionStatus) => void)[] =
    [];

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Check location permission status
  async checkPermission(): Promise<LocationPermissionStatus> {
    if (!navigator.permissions) {
      // Fallback for older browsers
      return this.fallbackPermissionCheck();
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      this.permissionStatus = {
        granted: result.state === "granted",
        denied: result.state === "denied",
        prompt: result.state === "prompt",
        unavailable: false,
      };

      // Listen for permission changes
      result.addEventListener("change", () => {
        this.checkPermission().then((status) => {
          this.permissionCallbacks.forEach((callback) => callback(status));
        });
      });

      return this.permissionStatus;
    } catch (error) {
      console.error("Error checking location permission:", error);
      return this.fallbackPermissionCheck();
    }
  }

  private fallbackPermissionCheck(): LocationPermissionStatus {
    // Basic check without Permissions API
    const hasGeolocation = "geolocation" in navigator;
    return {
      granted: false,
      denied: false,
      prompt: hasGeolocation,
      unavailable: !hasGeolocation,
    };
  }

  // Request location permission and get current position
  async requestLocation(
    options: LocationPermissionOptions = {}
  ): Promise<LocationData> {
    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 30000,
    };

    const maxAccuracy = options.maxAccuracy ?? 1000; // Default 1km max accuracy

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Validate location accuracy
          if (position.coords.accuracy > maxAccuracy) {
            reject(
              new Error(
                `Location accuracy too low (${Math.round(position.coords.accuracy)}m). ` +
                  `Maximum allowed accuracy is ${maxAccuracy}m. ` +
                  `Please ensure GPS is enabled and you have a clear view of the sky.`
              )
            );
            return;
          }

          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            altitude: position.coords.altitude || undefined,
          };

          this.lastLocation = locationData;
          resolve(locationData);
        },
        (error) => {
          let errorMessage = "Failed to get location";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }

          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }

  // Start continuous location tracking (for riders)
  startLocationTracking(
    options: RiderLocationTrackingOptions,
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void
  ): void {
    if (!navigator.geolocation) {
      onError?.(new Error("Geolocation is not supported"));
      return;
    }

    const watchOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: options.updateInterval,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        // Validate location accuracy for tracking
        const maxAccuracy = 1000; // 1km max for tracking
        if (position.coords.accuracy > maxAccuracy) {
          onError?.(
            new Error(
              `Location accuracy too low (${Math.round(position.coords.accuracy)}m) for tracking. ` +
                `Please ensure GPS is enabled and you have a clear view of the sky.`
            )
          );
          return;
        }

        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
          altitude: position.coords.altitude || undefined,
        };

        // Spoofing detection
        if (
          options.spoofingDetection &&
          this.detectLocationSpoofing(locationData)
        ) {
          onError?.(new Error("Location spoofing detected"));
          return;
        }

        // Battery optimization check
        if (
          options.batteryOptimizationWarning &&
          this.shouldWarnBatteryOptimization()
        ) {
          console.warn(
            "Battery optimization may be affecting location accuracy"
          );
        }

        this.lastLocation = locationData;
        onLocationUpdate(locationData);
        this.locationCallbacks.forEach((callback) => callback(locationData));
      },
      (error) => {
        let errorMessage = "Location tracking failed";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission revoked";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        onError?.(new Error(errorMessage));
      },
      watchOptions
    );
  }

  // Stop location tracking
  stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Get last known location
  getLastLocation(): LocationData | null {
    return this.lastLocation;
  }

  // Check if location is within service area
  async isWithinServiceArea(
    location: LocationData,
    serviceArea: ServiceArea
  ): Promise<boolean> {
    // Simple bounding box check first
    const bounds = serviceArea.bounds as {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    if (
      location.latitude < bounds.south ||
      location.latitude > bounds.north ||
      location.longitude < bounds.west ||
      location.longitude > bounds.east
    ) {
      return false;
    }

    // Calculate distance from center
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      serviceArea.centerLat,
      serviceArea.centerLng
    );

    return distance <= serviceArea.radiusKm;
  }

  // Check if location is within delivery zone
  async isWithinDeliveryZone(
    location: LocationData,
    deliveryZone: DeliveryZone
  ): Promise<boolean> {
    // For now, use simple distance check from zone center
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      deliveryZone.centerLat,
      deliveryZone.centerLng
    );

    return distance <= deliveryZone.radiusKm;
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Detect potential location spoofing
  private detectLocationSpoofing(location: LocationData): boolean {
    if (!this.lastLocation) return false;

    const timeDiff =
      Number(location.timestamp) - Number(this.lastLocation.timestamp);
    const distance = this.calculateDistance(
      location.latitude,
      location.longitude,
      this.lastLocation.latitude,
      this.lastLocation.longitude
    );

    // Check for impossible speed (faster than commercial jet)
    const speedKmh = distance / (timeDiff / 1000 / 3600);
    const maxReasonableSpeed = 1200; // km/h

    return speedKmh > maxReasonableSpeed;
  }

  // Check if battery optimization might affect location
  private shouldWarnBatteryOptimization(): boolean {
    // This is a simplified check - in reality, you'd check system settings
    return (
      navigator.userAgent.includes("Android") &&
      Boolean(this.lastLocation?.accuracy) &&
      (this.lastLocation?.accuracy ?? 0) > 100
    ); // Rough accuracy threshold
  }

  // Subscribe to location updates
  onLocationUpdate(callback: (location: LocationData) => void): () => void {
    this.locationCallbacks.push(callback);
    return () => {
      const index = this.locationCallbacks.indexOf(callback);
      if (index > -1) {
        this.locationCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to permission changes
  onPermissionChange(
    callback: (status: LocationPermissionStatus) => void
  ): () => void {
    this.permissionCallbacks.push(callback);
    return () => {
      const index = this.permissionCallbacks.indexOf(callback);
      if (index > -1) {
        this.permissionCallbacks.splice(index, 1);
      }
    };
  }

  // Get platform-specific permission instructions
  getPermissionInstructions(): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      return "Go to Settings > Privacy & Security > Location Services > Safari Websites > Allow";
    } else if (isAndroid) {
      return "Go to Settings > Apps > [Browser] > Permissions > Location > Allow";
    } else {
      return "Please enable location permissions in your browser settings";
    }
  }

  // Request background location permission (limited browser support)
  async requestBackgroundLocation(): Promise<boolean> {
    if ("permissions" in navigator) {
      try {
        const result = await navigator.permissions.query({
          name: "geolocation",
          // @ts-ignore - background permission might not be widely supported
          background: true,
        });
        return result.state === "granted";
      } catch {
        // Background permission not supported
        return false;
      }
    }
    return false;
  }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
