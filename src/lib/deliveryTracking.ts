// Delivery Tracking System with Real-Time Updates

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface DeliveryStatus {
  id: string;
  orderId: string;
  riderId: string;
  status: "assigned" | "picked_up" | "in_transit" | "delivered" | "failed";
  statusMessage: string;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  currentLocation?: DeliveryLocation;
  route?: DeliveryLocation[];
  distanceRemaining?: number;
  timeRemaining?: number;
  lastUpdated: Date;
}

export interface DeliveryTrackingData {
  delivery: DeliveryStatus;
  rider: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber: string;
    rating: number;
    photo?: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    address: {
      latitude: number;
      longitude: number;
      fullAddress: string;
    };
  };
  shop: {
    id: string;
    name: string;
    address: {
      latitude: number;
      longitude: number;
      fullAddress: string;
    };
  };
}

// Real-time delivery tracking class
export class DeliveryTracker {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscribers: Map<string, (data: DeliveryTrackingData) => void> =
    new Map();

  constructor(private deliveryId: string) {}

  // Connect to WebSocket for real-time updates
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001"}/deliveries/${this.deliveryId}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("Delivery tracking connected");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: DeliveryTrackingData = JSON.parse(event.data);
            this.notifySubscribers(data);
          } catch (error) {
            console.error("Failed to parse delivery tracking data:", error);
          }
        };

        this.ws.onclose = () => {
          console.log("Delivery tracking disconnected");
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("Delivery tracking error:", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  // Subscribe to delivery updates
  subscribe(callback: (data: DeliveryTrackingData) => void): string {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(id, callback);
    return id;
  }

  // Unsubscribe from delivery updates
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  // Notify all subscribers
  private notifySubscribers(data: DeliveryTrackingData): void {
    this.subscribers.forEach((callback) => callback(data));
  }

  // Attempt to reconnect
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(
        () => {
          this.reconnectAttempts++;
          console.log(
            `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );
          this.connect().catch(() => {
            // Reconnection failed, will try again
          });
        },
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
      );
    }
  }

  // Disconnect
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
  }
}

// Delivery status utilities
export const DELIVERY_STATUSES = {
  assigned: {
    label: "Assigned to Rider",
    description: "Your order has been assigned to a delivery rider",
    color: "bg-blue-500",
    icon: "User",
  },
  picked_up: {
    label: "Order Picked Up",
    description: "Rider has picked up your order from the shop",
    color: "bg-yellow-500",
    icon: "Package",
  },
  in_transit: {
    label: "On the Way",
    description: "Your order is on the way to your location",
    color: "bg-orange-500",
    icon: "Truck",
  },
  delivered: {
    label: "Delivered",
    description: "Your order has been successfully delivered",
    color: "bg-green-500",
    icon: "CheckCircle",
  },
  failed: {
    label: "Delivery Failed",
    description: "There was an issue with the delivery",
    color: "bg-red-500",
    icon: "XCircle",
  },
} as const;

export function getDeliveryStatusInfo(status: keyof typeof DELIVERY_STATUSES) {
  return DELIVERY_STATUSES[status];
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Estimate delivery time based on distance and average speed
export function estimateDeliveryTime(
  distanceKm: number,
  averageSpeedKmh: number = 25
): number {
  // Add buffer time for pickup, traffic, and delivery
  const travelTime = (distanceKm / averageSpeedKmh) * 60; // minutes
  const bufferTime = 15; // 15 minutes buffer
  return Math.ceil(travelTime + bufferTime);
}

// Format time remaining
export function formatTimeRemaining(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

// Format distance remaining
export function formatDistanceRemaining(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// API functions for delivery tracking
export async function getDeliveryTracking(
  orderId: string
): Promise<DeliveryTrackingData> {
  const response = await fetch(`/api/deliveries/tracking/${orderId}`, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || "Failed to fetch delivery tracking data"
    );
  }

  return await response.json();
}

export async function updateDeliveryLocation(
  deliveryId: string,
  location: DeliveryLocation
): Promise<void> {
  try {
    const response = await fetch(`/api/deliveries/${deliveryId}/location`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(location),
    });

    if (!response.ok) {
      throw new Error("Failed to update delivery location");
    }
  } catch (error) {
    console.error("Error updating delivery location:", error);
    throw error;
  }
}

export async function updateDeliveryStatus(
  deliveryId: string,
  status: DeliveryStatus["status"],
  statusMessage?: string
): Promise<void> {
  try {
    const response = await fetch(`/api/deliveries/${deliveryId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, statusMessage }),
    });

    if (!response.ok) {
      throw new Error("Failed to update delivery status");
    }
  } catch (error) {
    console.error("Error updating delivery status:", error);
    throw error;
  }
}
