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
  maxAccuracy?: number;
}

export interface RiderLocationTrackingOptions {
  updateInterval: number;
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

  private locationCallbacks = new Set<(l: LocationData) => void>();
  private permissionCallbacks = new Set<
    (s: LocationPermissionStatus) => void
  >();

  private permissionListenerAttached = false;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // -------------------- PERMISSION --------------------

  async checkPermission(): Promise<LocationPermissionStatus> {
    if (!("permissions" in navigator)) {
      return this.fallbackPermissionCheck();
    }

    try {
      const result = await navigator.permissions.query({
        name: "geolocation",
      });

      this.permissionStatus = {
        granted: result.state === "granted",
        denied: result.state === "denied",
        prompt: result.state === "prompt",
        unavailable: false,
      };

      if (!this.permissionListenerAttached) {
        this.permissionListenerAttached = true;
        result.addEventListener("change", () => {
          this.checkPermission().then((status) => {
            this.permissionCallbacks.forEach((cb) => cb(status));
          });
        });
      }

      return this.permissionStatus;
    } catch (error) {
      // If permissions API fails, try to determine status by attempting geolocation
      console.warn("Permissions API not available, using fallback:", error);
      return this.fallbackPermissionCheck();
    }
  }

  private fallbackPermissionCheck(): LocationPermissionStatus {
    const supported = "geolocation" in navigator;
    return {
      granted: false,
      denied: false,
      prompt: supported,
      unavailable: !supported,
    };
  }

  // -------------------- PERMISSION REQUEST --------------------

  async requestPermission(): Promise<LocationPermissionStatus> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          granted: false,
          denied: false,
          prompt: false,
          unavailable: true,
        });
        return;
      }

      // Try to get current position to trigger permission prompt
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Permission granted
          const status: LocationPermissionStatus = {
            granted: true,
            denied: false,
            prompt: false,
            unavailable: false,
          };
          this.permissionStatus = status;
          resolve(status);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            // Permission denied
            const status: LocationPermissionStatus = {
              granted: false,
              denied: true,
              prompt: false,
              unavailable: false,
            };
            this.permissionStatus = status;
            resolve(status);
          } else {
            // Other error (timeout, unavailable)
            const status: LocationPermissionStatus = {
              granted: false,
              denied: false,
              prompt: false,
              unavailable: err.code === err.POSITION_UNAVAILABLE,
            };
            this.permissionStatus = status;
            resolve(status);
          }
        },
        {
          enableHighAccuracy: false, // Don't need high accuracy for permission check
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  }

  // -------------------- SINGLE REQUEST --------------------

  async requestLocation(
    options: LocationPermissionOptions = {}
  ): Promise<LocationData> {
    const maxAccuracy = options.maxAccuracy ?? 100; // Reduced from 1000m to 100m for better accuracy

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      // Try multiple times with different accuracy settings
      const attemptLocation = (attemptCount = 0) => {
        const timeout = attemptCount === 0 ? (options.timeout ?? 15000) : 10000;
        const enableHighAccuracy = attemptCount < 2; // Try high accuracy first, then fallback

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            // For riders, we want very high accuracy (< 50m)
            const requiredAccuracy = options.enableHighAccuracy
              ? 50
              : maxAccuracy;

            if (pos.coords.accuracy > requiredAccuracy) {
              if (attemptCount < 2) {
                // Try again with different settings
                console.warn(
                  `Low accuracy (${Math.round(pos.coords.accuracy)}m), retrying...`
                );
                setTimeout(() => attemptLocation(attemptCount + 1), 1000);
                return;
              } else {
                // Accept lower accuracy after retries
                console.warn(
                  `Accepting lower accuracy: ${Math.round(pos.coords.accuracy)}m`
                );
              }
            }

            const loc: LocationData = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: pos.timestamp,
              speed: pos.coords.speed ?? undefined,
              heading: pos.coords.heading ?? undefined,
              altitude: pos.coords.altitude ?? undefined,
            };

            this.lastLocation = loc;
            resolve(loc);
          },
          (err) => {
            if (attemptCount < 2) {
              // Try again with different settings
              console.warn(
                `Location attempt ${attemptCount + 1} failed, retrying...`
              );
              setTimeout(() => attemptLocation(attemptCount + 1), 2000);
              return;
            }

            reject(
              new Error(
                err.code === err.PERMISSION_DENIED
                  ? "Location permission denied. Please enable location access in your browser settings."
                  : err.code === err.TIMEOUT
                    ? "Location request timed out. Please check your GPS signal and try again."
                    : `Location unavailable: ${err.message}`
              )
            );
          },
          {
            enableHighAccuracy: enableHighAccuracy,
            timeout: timeout,
            maximumAge: options.maximumAge ?? 10000, // Reduced from 30s to 10s for fresher data
          }
        );
      };

      attemptLocation();
    });
  }

  // -------------------- TRACKING --------------------

  startLocationTracking(
    options: RiderLocationTrackingOptions,
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void
  ): void {
    if (!navigator.geolocation) {
      onError?.(new Error("Geolocation not supported"));
      return;
    }

    if (this.watchId !== null) return; // 🔒 prevent duplicate watch

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: LocationData = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
          speed: pos.coords.speed ?? undefined,
          heading: pos.coords.heading ?? undefined,
          altitude: pos.coords.altitude ?? undefined,
        };

        if (options.spoofingDetection && this.detectLocationSpoofing(loc)) {
          onError?.(new Error("Location spoofing detected"));
          return;
        }

        this.lastLocation = loc;
        onLocationUpdate(loc);
        this.locationCallbacks.forEach((cb) => cb(loc));
      },
      (err) => {
        onError?.(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "permission"
              : err.code === err.TIMEOUT
                ? "timeout"
                : "unavailable"
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: options.updateInterval,
      }
    );
  }

  stopLocationTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // -------------------- HELPERS --------------------

  getLastLocation(): LocationData | null {
    return this.lastLocation;
  }

  private detectLocationSpoofing(next: LocationData): boolean {
    if (!this.lastLocation) return false;

    const t1 = Number(this.lastLocation.timestamp);
    const t2 = Number(next.timestamp);
    if (!isFinite(t1) || !isFinite(t2) || t2 <= t1) return false;

    const distance = this.calculateDistance(
      this.lastLocation.latitude,
      this.lastLocation.longitude,
      next.latitude,
      next.longitude
    );

    const speedKmh = (distance / ((t2 - t1) / 1000)) * 3.6;
    return speedKmh > 1200;
  }

  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(v: number) {
    return (v * Math.PI) / 180;
  }

  // -------------------- SUBSCRIPTIONS --------------------

  onLocationUpdate(cb: (location: LocationData) => void): () => void {
    this.locationCallbacks.add(cb);
    return () => this.locationCallbacks.delete(cb);
  }

  onPermissionChange(
    cb: (status: LocationPermissionStatus) => void
  ): () => void {
    this.permissionCallbacks.add(cb);
    return () => this.permissionCallbacks.delete(cb);
  }

  // -------------------- UX HELPERS --------------------

  getPermissionInstructions(): string {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent))
      return "Settings → Privacy & Security → Location Services → Safari → Allow";
    if (/Android/.test(navigator.userAgent))
      return "Settings → Apps → Browser → Permissions → Location → Allow";
    return "Enable location permission in browser settings";
  }

  async requestBackgroundLocation(): Promise<boolean> {
    try {
      const res = await navigator.permissions.query({
        name: "geolocation",
      });
      return res.state === "granted";
    } catch {
      return false;
    }
  }
}

export const locationService = LocationService.getInstance();
