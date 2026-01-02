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
    if (userType !== "rider" || this.isActive) return;

    console.log("🚀 Starting real-time location monitoring for rider:", userId);
    this.isActive = true;
    this.warningsShown.clear();
    this.lastAccuracy = Infinity;
    this.lastLocation = null;
    this.lastDbUpdate = 0;

    // Start real-time GPS watching
    this.startGpsWatching();

    // Start logout timer
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

  // Start real-time GPS watching
  private startGpsWatching(): void {
    if (!this.config.enableRealTimeUpdates || typeof navigator === "undefined")
      return;

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handleLocationUpdate(position),
        (error) => this.handleLocationError(error),
        {
          enableHighAccuracy: true,
          timeout: 30000, // 30 second timeout
          maximumAge: 10000, // Accept positions up to 10 seconds old
        }
      );
      console.log("📍 GPS watching started with watchId:", this.watchId);
    } catch (error) {
      console.error("❌ Failed to start GPS watching:", error);
      // Fallback to periodic checks if watching fails
      this.startPeriodicChecks();
    }
  }

  // Handle real-time location updates
  private handleLocationUpdate(position: GeolocationPosition): void {
    if (!this.isActive) return;

    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    };

    console.log(
      `📍 Real-time location: ${Math.round(location.accuracy)}m accuracy`
    );

    // Update accuracy for monitoring
    this.lastAccuracy = location.accuracy;

    // Check if we need to update database (throttled)
    const shouldUpdateDb = this.shouldUpdateDatabase(location);

    if (shouldUpdateDb) {
      this.updateDatabase(location);
    }

    // Always broadcast to WebSocket for real-time UI updates
    this.broadcastLocationUpdate(location);

    // Handle accuracy warnings and logout timer
    if (location.accuracy <= this.config.maxAccuracy) {
      this.resetLogoutTimer();
      this.clearWarnings();
    } else {
      this.showAccuracyWarnings(location.accuracy);
    }
  }

  // Handle GPS errors
  private handleLocationError(error: GeolocationPositionError): void {
    console.error("❌ GPS watching error:", error);
    this.showAccuracyWarnings(Infinity); // Show max warnings
  }

  // Determine if database should be updated (throttled)
  private shouldUpdateDatabase(newLocation: any): boolean {
    const now = Date.now();

    // Always update if no previous location
    if (!this.lastLocation) return true;

    // Update if enough time has passed
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

  // Update database with location (throttled)
  private async updateDatabase(location: any): Promise<void> {
    try {
      this.lastLocation = location;
      this.lastDbUpdate = Date.now();

      const response = await fetch("/api/riders/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed || null,
          heading: location.heading || null,
        }),
      });

      if (!response.ok) {
        console.error("❌ Failed to update location in database");
      } else {
        console.log("✅ Location updated in database");
      }
    } catch (error) {
      console.error("❌ Database update error:", error);
    }
  }

  // Broadcast location update via WebSocket (real-time)
  private broadcastLocationUpdate(location: any): void {
    // This would integrate with your WebSocket system
    // For now, just log it
    console.log("📡 Broadcasting location update:", location);
  }

  // Fallback periodic checks if GPS watching fails
  private startPeriodicChecks(): void {
    console.log("⚠️ Using periodic location checks as fallback");

    setTimeout(async () => {
      if (!this.isActive) return;

      try {
        const location = await locationService.requestLocation({
          enableHighAccuracy: true,
          timeout: 10000,
          maxAccuracy: this.config.maxAccuracy,
        });

        this.handleLocationUpdate({
          coords: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            speed: location.speed,
            heading: location.heading,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      } catch (error) {
        console.error("❌ Periodic location check failed:", error);
      }

      // Continue periodic checks
      if (this.isActive) {
        this.startPeriodicChecks();
      }
    }, 30000); // Check every 30 seconds as fallback
  }
  // Show accuracy warnings
  private showAccuracyWarnings(accuracy: number): void {
    const warnings: string[] = [];

    if (accuracy > this.config.maxAccuracy) {
      warnings.push("GPS_ACCURACY_TOO_LOW");
    } else if (accuracy > this.config.warningThreshold) {
      warnings.push("GPS_ACCURACY_LOW");
    }

    // Show warnings that haven't been shown before
    warnings.forEach((warning) => {
      if (!this.warningsShown.has(warning)) {
        this.showWarningNotification(warning, accuracy);
        this.warningsShown.add(warning);
      }
    });
  }

  // Clear warnings when accuracy improves
  private clearWarnings(): void {
    if (this.warningsShown.size > 0) {
      console.log("✅ GPS accuracy improved, clearing warnings");
      this.showSuccessNotification();
      this.warningsShown.clear();
    }
  }

  // Show warning notification
  private showWarningNotification(warningType: string, accuracy: number): void {
    let title = "GPS Accuracy Issue";
    let message = "";

    switch (warningType) {
      case "GPS_ACCURACY_LOW":
        title = "GPS Accuracy Low";
        message = `Current accuracy: ${Math.round(accuracy)}m. Please move to an open area for better GPS signal.`;
        break;
      case "GPS_ACCURACY_TOO_LOW":
        title = "GPS Accuracy Too Low";
        message = `Current accuracy: ${Math.round(accuracy)}m. You will be logged out in ${Math.round(this.config.logoutTimeout / 60000)} minutes if accuracy doesn't improve.`;
        break;
    }

    // Show browser notification if permitted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/favicon.ico",
        tag: "gps-accuracy",
      });
    }

    // Show in-app notification (you can integrate with your notification system)
    console.warn(`⚠️ ${title}: ${message}`);

    // You can also dispatch a custom event for UI components to listen to
    window.dispatchEvent(
      new CustomEvent("gps-accuracy-warning", {
        detail: { type: warningType, accuracy, message },
      })
    );
  }

  // Show success notification
  private showSuccessNotification(): void {
    const title = "GPS Accuracy Restored";
    const message = "Your GPS accuracy is now within acceptable limits.";

    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: message,
        icon: "/favicon.ico",
        tag: "gps-accuracy",
      });
    }

    console.log(`✅ ${title}: ${message}`);

    window.dispatchEvent(new CustomEvent("gps-accuracy-restored"));
  }

  // Start periodic location checks
  private startPeriodicChecks(): void {
    if (this.checkInterval) clearInterval(this.checkInterval);

    this.checkInterval = setInterval(() => {
      this.checkLocationAccuracy();
    }, this.config.checkInterval);

    // Initial check
    setTimeout(() => this.checkLocationAccuracy(), 1000);
  }

  // Start logout timer
  private startLogoutTimer(): void {
    if (this.logoutTimeout) clearTimeout(this.logoutTimeout);

    this.logoutTimeout = setTimeout(async () => {
      if (this.lastKnownAccuracy > this.config.maxAccuracy) {
        console.warn("🚪 Auto-logout triggered due to poor GPS accuracy");
        await this.performAutoLogout();
      }
    }, this.config.logoutTimeout);
  }

  // Reset logout timer
  private resetLogoutTimer(): void {
    if (this.logoutTimeout) {
      clearTimeout(this.logoutTimeout);
      this.startLogoutTimer();
    }
  }

  // Perform auto-logout
  private async performAutoLogout(): Promise<void> {
    try {
      // Show final warning
      const title = "Automatic Logout";
      const message =
        "You are being logged out due to poor GPS accuracy. Please ensure proper GPS signal and try again.";

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body: message,
          icon: "/favicon.ico",
          tag: "auto-logout",
          requireInteraction: true,
        });
      }

      // Call logout API
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Redirect to login
        window.location.href = "/auth/login?reason=gps_accuracy";
      } else {
        console.error("Logout API failed, forcing page reload");
        window.location.reload();
      }
    } catch (error) {
      console.error("Auto-logout failed:", error);
      // Force reload as fallback
      window.location.reload();
    }
  }

  // Get current status
  getStatus() {
    return {
      isActive: this.isActive,
      lastAccuracy: this.lastKnownAccuracy,
      warnings: Array.from(this.warningsShown),
      timeUntilLogout: this.logoutTimeout
        ? Math.max(0, (this.config.logoutTimeout - Date.now()) / 1000)
        : 0,
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<LocationMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (this.isActive) {
      // Restart with new config
      this.stopMonitoring();
      // Note: Need to restart monitoring manually after config update
    }
  }
}

// Global instance
export const locationMonitor = LocationMonitor.getInstance();

// Helper functions for components
export function startLocationMonitoring(
  userId: string,
  userType: string = "rider"
): void {
  locationMonitor.startMonitoring(userId, userType);
}

export function stopLocationMonitoring(): void {
  locationMonitor.stopMonitoring();
}

export function getLocationMonitorStatus() {
  return locationMonitor.getStatus();
}

// React hook for components
export function useLocationMonitor() {
  const [status, setStatus] = React.useState(locationMonitor.getStatus());

  React.useEffect(() => {
    const updateStatus = () => setStatus(locationMonitor.getStatus());

    // Listen for accuracy events
    window.addEventListener("gps-accuracy-warning", updateStatus);
    window.addEventListener("gps-accuracy-restored", updateStatus);

    // Periodic status updates
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener("gps-accuracy-warning", updateStatus);
      window.removeEventListener("gps-accuracy-restored", updateStatus);
      clearInterval(interval);
    };
  }, []);

  return status;
}

// Import React for the hook (this would normally be at the top)
import React from "react";
