// Production-Ready Location Monitor
// Real-time GPS tracking with throttled database updates to prevent system overload

import { locationService } from "@/services/location.service";

export interface LocationMonitorConfig {
  dbUpdateInterval: number; // Minimum time between DB updates (ms) - prevents overload
  accuracyChangeThreshold: number; // Update DB if accuracy changes by this much (meters)
  maxAccuracy: number; // Maximum allowed accuracy (meters)
  warningThreshold: number; // Show warnings above this accuracy (meters)
  logoutTimeout: number; // Auto-logout after this time (ms) if accuracy poor
  enableRealTimeUpdates: boolean; // Use watchPosition for real-time updates
}

export interface LocationMonitorStatus {
  isActive: boolean;
  lastAccuracy: number;
  warnings: string[];
  timeUntilLogout: number;
}

export class LocationMonitor {
  private static instance: LocationMonitor;
  private config: LocationMonitorConfig;
  private watchId: number | null = null;
  private logoutTimeout: NodeJS.Timeout | null = null;
  private lastDbUpdate: number = 0;
  private lastLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null = null;
  private lastAccuracy: number = Infinity;
  private warningsShown: Set<string> = new Set();
  private isActive = false;
  private logoutStartTime: number = 0;

  private defaultConfig: LocationMonitorConfig = {
    dbUpdateInterval: 60000, // Update DB max once per minute (production-safe)
    accuracyChangeThreshold: 20, // Update if accuracy changes by 20m
    maxAccuracy: 100, // 100 meters max
    warningThreshold: 50, // Warn above 50 meters
    logoutTimeout: 10 * 60 * 1000, // 10 minutes
    enableRealTimeUpdates: true, // Use real-time GPS watching
  };

  private constructor(config?: Partial<LocationMonitorConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  static getInstance(config?: Partial<LocationMonitorConfig>): LocationMonitor {
    if (!LocationMonitor.instance) {
      LocationMonitor.instance = new LocationMonitor(config);
    }
    return LocationMonitor.instance;
  }

  // Start monitoring for a rider
  startMonitoring(userId: string, userType: string = "rider"): void {
    if (userType !== "rider") return;

    if (this.isActive) {
      console.log("📍 Location monitoring already active for rider:", userId);
      return;
    }

    console.log(
      "🚀 Starting production-ready location monitoring for rider:",
      userId
    );
    this.isActive = true;
    this.warningsShown.clear();
    this.lastAccuracy = Infinity;
    this.lastLocation = null;
    this.lastDbUpdate = 0;

    // Start real-time GPS watching (production-optimized)
    this.startGpsWatching();

    // Start logout timer for poor accuracy
    this.startLogoutTimer();
  }

  // Stop monitoring
  stopMonitoring(): void {
    console.log("🛑 Stopping location monitoring");
    this.isActive = false;

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.logoutTimeout) {
      clearTimeout(this.logoutTimeout);
      this.logoutTimeout = null;
    }

    this.warningsShown.clear();
  }

  // Production-ready GPS watching with throttled DB updates
  private startGpsWatching(): void {
    if (!this.config.enableRealTimeUpdates || typeof navigator === "undefined")
      return;

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handleRealTimeLocationUpdate(position),
        (error) => this.handleLocationError(error),
        {
          enableHighAccuracy: true,
          timeout: 30000, // 30 second timeout (production-safe)
          maximumAge: 10000, // Accept positions up to 10 seconds old
        }
      );
      console.log("📍 Real-time GPS watching started (production mode)");
    } catch (error) {
      console.error("❌ Failed to start GPS watching:", error);
    }
  }

  // Handle real-time location updates (throttled DB updates)
  private handleRealTimeLocationUpdate(position: GeolocationPosition): void {
    if (!this.isActive) return;

    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: position.timestamp,
    };

    // Update accuracy for monitoring
    this.lastAccuracy = location.accuracy;

    // Real-time WebSocket broadcast (no throttling for UI)
    this.broadcastRealTimeUpdate(location);

    // Throttled database update (prevents system overload)
    if (this.shouldUpdateDatabase(location)) {
      this.updateDatabaseThrottled(location);
    }

    // Handle accuracy monitoring
    if (location.accuracy <= this.config.maxAccuracy) {
      this.resetLogoutTimer();
      this.clearWarnings();
    } else {
      this.showAccuracyWarnings(location.accuracy);
    }
  }

  // Determine if database should be updated (production throttling)
  private shouldUpdateDatabase(newLocation: any): boolean {
    const now = Date.now();

    // Always update if no previous location
    if (!this.lastLocation) return true;

    // Update if enough time has passed (prevents overload)
    if (now - this.lastDbUpdate >= this.config.dbUpdateInterval) return true;

    // Update if accuracy changed significantly
    const accuracyChange = Math.abs(
      newLocation.accuracy - this.lastLocation.accuracy
    );
    if (accuracyChange >= this.config.accuracyChangeThreshold) return true;

    // Update if location changed significantly (more than 50 meters)
    const distance = this.calculateDistance(
      newLocation.latitude,
      newLocation.longitude,
      this.lastLocation.latitude,
      this.lastLocation.longitude
    );
    if (distance > 50) return true;

    return false;
  }

  // Throttled database update (production-safe)
  private async updateDatabaseThrottled(location: any): Promise<void> {
    try {
      // Validate location data before sending
      if (
        !location ||
        typeof location.latitude !== "number" ||
        typeof location.longitude !== "number"
      ) {
        console.error("❌ Invalid location data for DB update:", location);
        return;
      }

      this.lastLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      };
      this.lastDbUpdate = Date.now();

      const payload = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        speed: location.speed || null,
        heading: location.heading || null,
      };

      console.log("📡 Sending DB update:", payload);

      const response = await fetch("/api/riders/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include", // Include cookies for authentication
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ DB updated (throttled):", result);
      } else {
        const errorText = await response.text();
        console.error("❌ DB update failed:", response.status, errorText);
      }
    } catch (error) {
      console.error("❌ DB update error:", error);
    }
  }

  // Real-time WebSocket broadcast (no throttling)
  private broadcastRealTimeUpdate(location: any): void {
    // Immediate broadcast for real-time UI updates
    console.log(`📡 Real-time update: ${Math.round(location.accuracy)}m`);

    // Dispatch to WebSocket system for real-time delivery tracking
    window.dispatchEvent(
      new CustomEvent("rider-location-update", {
        detail: location,
      })
    );
  }

  // Handle GPS errors
  private handleLocationError(error: GeolocationPositionError): void {
    console.error("❌ GPS error:", error);
    this.showAccuracyWarnings(Infinity);
  }

  // Calculate distance between coordinates
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Return meters
  }

  // Start logout timer for poor accuracy
  private startLogoutTimer(): void {
    this.logoutStartTime = Date.now();
    this.logoutTimeout = setTimeout(async () => {
      if (this.lastAccuracy > this.config.maxAccuracy) {
        console.warn("⏰ Auto-logout: Poor GPS accuracy for too long");
        try {
          await fetch("/api/auth/logout", { method: "POST" });
          alert(
            "You have been logged out due to poor GPS accuracy. Please ensure GPS is enabled and try again."
          );
          window.location.href = "/auth/login";
        } catch (error) {
          console.error("Auto-logout failed:", error);
        }
      }
    }, this.config.logoutTimeout);
  }

  // Reset logout timer when accuracy improves
  private resetLogoutTimer(): void {
    if (this.logoutTimeout) {
      clearTimeout(this.logoutTimeout);
      this.logoutTimeout = null;
    }
    if (this.isActive) {
      this.startLogoutTimer();
    }
  }

  // Show accuracy warnings
  private showAccuracyWarnings(accuracy: number): void {
    const warnings: string[] = [];

    if (accuracy > this.config.maxAccuracy) {
      warnings.push("GPS accuracy too low for delivery tracking");
    } else if (accuracy > this.config.warningThreshold) {
      warnings.push("GPS accuracy could be improved");
    }

    // Dispatch warnings to UI
    if (warnings.length > 0) {
      window.dispatchEvent(
        new CustomEvent("location-monitor-warning", {
          detail: { warnings, accuracy },
        })
      );
    }

    this.warningsShown = new Set(warnings);
  }

  // Clear warnings when accuracy improves
  private clearWarnings(): void {
    if (this.warningsShown.size > 0) {
      window.dispatchEvent(
        new CustomEvent("location-monitor-cleared", {
          detail: { accuracy: this.lastAccuracy },
        })
      );
      this.warningsShown.clear();
    }
  }

  // Get current status
  getStatus(): LocationMonitorStatus {
    const timeUntilLogout = this.logoutTimeout
      ? Math.max(
          0,
          this.config.logoutTimeout - (Date.now() - this.logoutStartTime)
        )
      : 0;

    return {
      isActive: this.isActive,
      lastAccuracy: this.lastAccuracy,
      warnings: Array.from(this.warningsShown),
      timeUntilLogout,
    };
  }
}

// Export singleton instance
export const locationMonitor = LocationMonitor.getInstance();

// Helper hook for React components
export function useLocationMonitor() {
  const [status, setStatus] = React.useState<LocationMonitorStatus>(
    locationMonitor.getStatus()
  );

  React.useEffect(() => {
    const updateStatus = () => setStatus(locationMonitor.getStatus());

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);

    // Listen for status changes
    const handleWarning = () => updateStatus();
    const handleCleared = () => updateStatus();

    window.addEventListener("location-monitor-warning", handleWarning);
    window.addEventListener("location-monitor-cleared", handleCleared);

    return () => {
      clearInterval(interval);
      window.removeEventListener("location-monitor-warning", handleWarning);
      window.removeEventListener("location-monitor-cleared", handleCleared);
    };
  }, []);

  return status;
}

// React import for hook
import React from "react";
