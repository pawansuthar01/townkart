import {
  LocationData,
  locationService,
  RiderLocationTrackingOptions,
} from "./location.service";

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

  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private networkCheckTimer: ReturnType<typeof setInterval> | null = null;

  private locationCallbacks = new Set<(l: LocationData) => void>();
  private stateCallbacks = new Set<(s: LocationTrackingState) => void>();

  private trackingStarted = false;

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

  // ---------------- CONFIG ----------------

  configure(options: ResilientLocationOptions): void {
    this.options = { ...this.options, ...options };
    this.state.maxRetries = this.options.maxRetries;
  }

  // ---------------- START / STOP ----------------

  async startResilientTracking(
    trackingOptions: RiderLocationTrackingOptions,
    onLocationUpdate?: (location: LocationData) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (this.trackingStarted) return;
    this.trackingStarted = true;

    this.state.isTracking = true;
    this.detectDeviceReboot();
    this.startNetworkMonitoring();

    locationService.startLocationTracking(
      trackingOptions,
      (location) => this.handleLocationUpdate(location, onLocationUpdate),
      (error) => this.handleLocationError(error, onError)
    );

    if (this.options.enableBackgroundSync) {
      this.startBackgroundSync();
    }

    this.notifyStateChange();
  }

  stopResilientTracking(): void {
    if (!this.trackingStarted) return;
    this.trackingStarted = false;

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

  // ---------------- LOCATION FLOW ----------------

  private async handleLocationUpdate(
    location: LocationData,
    onLocationUpdate?: (location: LocationData) => void
  ): Promise<void> {
    onLocationUpdate?.(location);
    this.locationCallbacks.forEach((cb) => cb(location));

    if (this.state.isOnline) {
      try {
        await this.syncLocationToServer(location);
        this.state.lastSuccessfulSync = new Date();
        this.state.retryCount = 0;
        this.state.backoffDelay = this.options.initialBackoffDelay;
      } catch {
        this.queueLocationForSync(location);
      }
    } else {
      this.queueLocationForSync(location);
    }

    this.notifyStateChange();
  }

  private handleLocationError(
    error: Error,
    onError?: (error: Error) => void
  ): void {
    if (error.message.includes("permission")) {
      onError?.(error);
      return;
    }

    if (this.state.retryCount < this.state.maxRetries) {
      this.state.retryCount++;
      this.state.backoffDelay = Math.min(
        this.state.backoffDelay * 2,
        this.options.maxBackoffDelay
      );
    } else {
      onError?.(
        new Error(
          `Location tracking failed after ${this.state.maxRetries} retries`
        )
      );
    }
  }

  // ---------------- QUEUE / SYNC ----------------

  private queueLocationForSync(location: LocationData): void {
    this.state.pendingLocations.push(location);

    if (this.state.pendingLocations.length > this.options.offlineQueueSize) {
      this.state.pendingLocations.shift();
    }

    this.persistPendingLocations();
  }

  private async syncPendingLocations(): Promise<void> {
    if (
      !this.state.isOnline ||
      this.state.pendingLocations.length === 0 ||
      !this.state.isTracking
    ) {
      return;
    }

    const locationsToSync = [...this.state.pendingLocations];

    try {
      const batchSize = 10;
      for (let i = 0; i < locationsToSync.length; i += batchSize) {
        await this.syncLocationBatchToServer(
          locationsToSync.slice(i, i + batchSize)
        );
      }

      this.state.pendingLocations = [];
      this.state.lastSuccessfulSync = new Date();
      this.state.retryCount = 0;
      this.state.backoffDelay = this.options.initialBackoffDelay;

      this.persistPendingLocations();
    } catch {
      // keep queue
    }

    this.notifyStateChange();
  }

  private async syncLocationToServer(location: LocationData): Promise<void> {
    const res = await fetch("/api/riders/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(location),
    });

    if (!res.ok) throw new Error("sync_failed");
  }

  private async syncLocationBatchToServer(
    locations: LocationData[]
  ): Promise<void> {
    const res = await fetch("/api/riders/location/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations }),
    });

    if (!res.ok) throw new Error("batch_sync_failed");
  }

  // ---------------- TIMERS ----------------

  private startBackgroundSync(): void {
    if (this.syncTimer) return;
    this.syncTimer = setInterval(
      () => this.syncPendingLocations(),
      this.options.syncInterval
    );
  }

  private startNetworkMonitoring(): void {
    if (this.networkCheckTimer) return;

    this.networkCheckTimer = setInterval(() => {
      const wasOnline = this.state.isOnline;
      this.state.isOnline = navigator.onLine;

      if (!wasOnline && this.state.isOnline) {
        this.state.networkRestored = true;
        this.syncPendingLocations();
      }

      this.notifyStateChange();
    }, 5000);
  }

  // ---------------- PERSISTENCE ----------------

  private detectDeviceReboot(): void {
    try {
      const key = "location_session_timestamp";
      const last = localStorage.getItem(key);
      const now = Date.now();

      this.state.deviceRebooted = !!last && now - Number(last) > 5 * 60 * 1000;

      localStorage.setItem(key, now.toString());

      if (this.state.deviceRebooted) {
        this.restorePendingLocations();
      }
    } catch {}
  }

  private persistPendingLocations(): void {
    try {
      localStorage.setItem(
        "pending_locations",
        JSON.stringify(this.state.pendingLocations)
      );
    } catch {}
  }

  private restorePendingLocations(): void {
    try {
      const stored = localStorage.getItem("pending_locations");
      if (!stored) return;

      const parsed = JSON.parse(stored) as LocationData[];
      this.state.pendingLocations = parsed.slice(
        -this.options.offlineQueueSize
      );
    } catch {}
  }

  // ---------------- EVENTS ----------------

  private initializeEventListeners(): void {
    if (typeof window === "undefined") return;

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.syncPendingLocations();
      }
    });

    window.addEventListener("beforeunload", () => {
      this.persistPendingLocations();
    });
  }

  // ---------------- SUBSCRIPTIONS ----------------

  onLocationUpdate(cb: (location: LocationData) => void): () => void {
    this.locationCallbacks.add(cb);
    return () => this.locationCallbacks.delete(cb);
  }

  onStateChange(cb: (state: LocationTrackingState) => void): () => void {
    this.stateCallbacks.add(cb);
    return () => this.stateCallbacks.delete(cb);
  }

  private notifyStateChange(): void {
    const snapshot = { ...this.state };
    this.stateCallbacks.forEach((cb) => cb(snapshot));
  }

  // ---------------- HELPERS ----------------

  getState(): LocationTrackingState {
    return { ...this.state };
  }

  async forceSync(): Promise<void> {
    if (!this.state.isOnline) {
      throw new Error("offline");
    }
    await this.syncPendingLocations();
  }

  clearPendingLocations(): void {
    this.state.pendingLocations = [];
    try {
      localStorage.removeItem("pending_locations");
    } catch {}
    this.notifyStateChange();
  }
}

// Export singleton instance
export const resilientLocationService = ResilientLocationService.getInstance();
