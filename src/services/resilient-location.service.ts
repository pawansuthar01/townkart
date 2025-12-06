import { LocationData, locationService } from "./location.service";

export interface LocationTrackingState {
  isOnline: boolean;
  isTracking: boolean;
  lastSuccessfulSync: Date | null;
  pendingLocations: LocationData[];
  retryCount: number;
  maxRetries: number;
  backoffDelay: number;
  deviceRebooted: boolean;
  networkRestored: boolean;
}

export interface ResilientLocationOptions {
  maxRetries?: number;
  initialBackoffDelay?: number;
  maxBackoffDelay?: number;
  offlineQueueSize?: number;
  syncInterval?: number;
  enableBackgroundSync?: boolean;
}

export class ResilientLocationService {
  private static instance: ResilientLocationService;
  private state: LocationTrackingState;
  private options: Required<ResilientLocationOptions>;
  private syncTimer: NodeJS.Timeout | null = null;
  private networkCheckTimer: NodeJS.Timeout | null = null;
  private locationCallbacks: ((location: LocationData) => void)[] = [];
  private stateCallbacks: ((state: LocationTrackingState) => void)[] = [];

  private constructor() {
    this.state = {
      isOnline: navigator.onLine,
      isTracking: false,
      lastSuccessfulSync: null,
      pendingLocations: [],
      retryCount: 0,
      maxRetries: 5,
      backoffDelay: 1000,
      deviceRebooted: false,
      networkRestored: false,
    };

    this.options = {
      maxRetries: 5,
      initialBackoffDelay: 1000,
      maxBackoffDelay: 30000,
      offlineQueueSize: 100,
      syncInterval: 30000,
      enableBackgroundSync: true,
    };

    this.initializeEventListeners();
  }

  static getInstance(): ResilientLocationService {
    if (!ResilientLocationService.instance) {
      ResilientLocationService.instance = new ResilientLocationService();
    }
    return ResilientLocationService.instance;
  }

  // Configure the service
  configure(options: ResilientLocationOptions): void {
    this.options = { ...this.options, ...options };
    this.state.maxRetries = this.options.maxRetries;
  }

  // Start resilient location tracking
  async startResilientTracking(
    trackingOptions: any,
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    this.state.isTracking = true;

    // Detect if device was rebooted
    this.detectDeviceReboot();

    // Start network monitoring
    this.startNetworkMonitoring();

    // Start location tracking
    locationService.startLocationTracking(
      trackingOptions,
      (location) => {
        this.handleLocationUpdate(location, onLocationUpdate);
      },
      (error) => {
        this.handleLocationError(error, onError);
      }
    );

    // Start background sync if enabled
    if (this.options.enableBackgroundSync) {
      this.startBackgroundSync();
    }

    this.notifyStateChange();
  }

  // Stop resilient tracking
  stopResilientTracking(): void {
    this.state.isTracking = false;

    locationService.stopLocationTracking();

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
      this.networkCheckTimer = null;
    }

    this.notifyStateChange();
  }

  // Handle location updates with offline queuing
  private async handleLocationUpdate(
    location: LocationData,
    onLocationUpdate: (location: LocationData) => void
  ): Promise<void> {
    // Always call the original callback
    onLocationUpdate(location);
    this.locationCallbacks.forEach((callback) => callback(location));

    if (this.state.isOnline) {
      // Try to sync immediately
      try {
        await this.syncLocationToServer(location);
        this.state.lastSuccessfulSync = new Date();
        this.state.retryCount = 0;
        this.state.backoffDelay = this.options.initialBackoffDelay;
      } catch (error) {
        console.warn("Failed to sync location, queuing for later:", error);
        this.queueLocationForSync(location);
      }
    } else {
      // Queue for later sync
      this.queueLocationForSync(location);
    }

    this.notifyStateChange();
  }

  // Handle location errors with retry logic
  private handleLocationError(
    error: Error,
    onError?: (error: Error) => void
  ): void {
    console.error("Location tracking error:", error);

    if (error.message.includes("permission")) {
      // Permission errors are critical
      onError?.(error);
      return;
    }

    // For other errors, implement exponential backoff
    if (this.state.retryCount < this.state.maxRetries) {
      this.state.retryCount++;
      this.state.backoffDelay = Math.min(
        this.state.backoffDelay * 2,
        this.options.maxBackoffDelay
      );

      setTimeout(() => {
        // Retry location tracking
        if (this.state.isTracking) {
          console.log(
            `Retrying location tracking (attempt ${this.state.retryCount})`
          );
          // Note: In a real implementation, you'd restart the tracking
        }
      }, this.state.backoffDelay);
    } else {
      onError?.(
        new Error(
          `Location tracking failed after ${this.state.maxRetries} retries`
        )
      );
    }
  }

  // Queue location for later sync
  private queueLocationForSync(location: LocationData): void {
    this.state.pendingLocations.push(location);

    // Limit queue size to prevent memory issues
    if (this.state.pendingLocations.length > this.options.offlineQueueSize) {
      this.state.pendingLocations.shift(); // Remove oldest
    }

    // Persist queue to localStorage for device reboots
    this.persistPendingLocations();
  }

  // Sync pending locations to server
  private async syncPendingLocations(): Promise<void> {
    if (this.state.pendingLocations.length === 0 || !this.state.isOnline) {
      return;
    }

    const locationsToSync = [...this.state.pendingLocations];

    try {
      // Send locations in batches
      const batchSize = 10;
      for (let i = 0; i < locationsToSync.length; i += batchSize) {
        const batch = locationsToSync.slice(i, i + batchSize);
        await this.syncLocationBatchToServer(batch);
      }

      // Clear synced locations
      this.state.pendingLocations = this.state.pendingLocations.slice(
        locationsToSync.length
      );
      this.state.lastSuccessfulSync = new Date();
      this.state.retryCount = 0;
      this.state.backoffDelay = this.options.initialBackoffDelay;

      // Clear persisted queue
      this.persistPendingLocations();
    } catch (error) {
      console.error("Failed to sync pending locations:", error);
      // Keep locations in queue for next attempt
    }

    this.notifyStateChange();
  }

  // Sync single location to server
  private async syncLocationToServer(location: LocationData): Promise<void> {
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
        timestamp: location.timestamp,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Failed to sync location");
    }
  }

  // Sync batch of locations to server
  private async syncLocationBatchToServer(
    locations: LocationData[]
  ): Promise<void> {
    const response = await fetch("/api/riders/location/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ locations }),
    });

    if (!response.ok) {
      throw new Error(`Batch sync failed with ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || "Failed to sync location batch");
    }
  }

  // Start background sync
  private startBackgroundSync(): void {
    this.syncTimer = setInterval(() => {
      if (this.state.isOnline && this.state.pendingLocations.length > 0) {
        this.syncPendingLocations();
      }
    }, this.options.syncInterval);
  }

  // Start network monitoring
  private startNetworkMonitoring(): void {
    this.networkCheckTimer = setInterval(() => {
      const wasOnline = this.state.isOnline;
      this.state.isOnline = navigator.onLine;

      if (!wasOnline && this.state.isOnline) {
        // Network restored
        this.state.networkRestored = true;
        console.log("Network restored, syncing pending locations...");
        this.syncPendingLocations();
      } else if (wasOnline && !this.state.isOnline) {
        console.log("Network lost, queuing locations...");
      }

      this.notifyStateChange();
    }, 5000); // Check every 5 seconds
  }

  // Detect device reboot
  private detectDeviceReboot(): void {
    const lastSessionKey = "location_session_timestamp";
    const lastSession = localStorage.getItem(lastSessionKey);
    const now = Date.now();

    if (!lastSession) {
      // First session
      this.state.deviceRebooted = false;
    } else {
      const timeSinceLastSession = now - parseInt(lastSession);
      // If more than 5 minutes have passed, assume reboot
      this.state.deviceRebooted = timeSinceLastSession > 5 * 60 * 1000;
    }

    localStorage.setItem(lastSessionKey, now.toString());

    if (this.state.deviceRebooted) {
      console.log("Device reboot detected, restoring pending locations...");
      this.restorePendingLocations();
    }
  }

  // Persist pending locations to localStorage
  private persistPendingLocations(): void {
    try {
      localStorage.setItem(
        "pending_locations",
        JSON.stringify(this.state.pendingLocations)
      );
    } catch (error) {
      console.warn("Failed to persist pending locations:", error);
    }
  }

  // Restore pending locations from localStorage
  private restorePendingLocations(): void {
    try {
      const stored = localStorage.getItem("pending_locations");
      if (stored) {
        const pendingLocations = JSON.parse(stored);
        this.state.pendingLocations = [
          ...this.state.pendingLocations,
          ...pendingLocations,
        ];

        // Limit restored queue size
        if (
          this.state.pendingLocations.length > this.options.offlineQueueSize
        ) {
          this.state.pendingLocations = this.state.pendingLocations.slice(
            -this.options.offlineQueueSize
          );
        }

        console.log(
          `Restored ${pendingLocations.length} pending locations from storage`
        );
      }
    } catch (error) {
      console.warn("Failed to restore pending locations:", error);
    }
  }

  // Initialize event listeners
  private initializeEventListeners(): void {
    if (typeof window === "undefined") return;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        console.log("App went to background");
        // Could adjust tracking frequency here
      } else {
        console.log("App came to foreground");
        // Sync any pending locations
        if (this.state.isOnline && this.state.pendingLocations.length > 0) {
          this.syncPendingLocations();
        }
      }
    });

    // Handle beforeunload to ensure final sync
    window.addEventListener("beforeunload", () => {
      if (this.state.pendingLocations.length > 0) {
        this.persistPendingLocations();
      }
    });
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

  // Subscribe to state changes
  onStateChange(callback: (state: LocationTrackingState) => void): () => void {
    this.stateCallbacks.push(callback);
    return () => {
      const index = this.stateCallbacks.indexOf(callback);
      if (index > -1) {
        this.stateCallbacks.splice(index, 1);
      }
    };
  }

  // Notify state change subscribers
  private notifyStateChange(): void {
    this.stateCallbacks.forEach((callback) => callback({ ...this.state }));
  }

  // Get current state
  getState(): LocationTrackingState {
    return { ...this.state };
  }

  // Force sync pending locations
  async forceSync(): Promise<void> {
    if (this.state.isOnline) {
      await this.syncPendingLocations();
    } else {
      throw new Error("Cannot sync while offline");
    }
  }

  // Clear all pending locations (for testing/admin purposes)
  clearPendingLocations(): void {
    this.state.pendingLocations = [];
    localStorage.removeItem("pending_locations");
    this.notifyStateChange();
  }
}

// Export singleton instance
export const resilientLocationService = ResilientLocationService.getInstance();
