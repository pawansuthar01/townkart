interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
  location?: any;
  orderId?: string;
}

interface OrderUpdateEvent {
  type: "order_status_update";
  orderId: string;
  status: string;
  data?: any;
  timestamp: string;
}

interface DeliveryUpdateEvent {
  type: "location_update";
  riderId: string;
  location: {
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy?: number;
    speed?: number;
  };
}

interface NotificationEvent {
  type: "notification";
  notificationType: string;
  data: any;
  priority: string;
  timestamp: string;
}

class SocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000; // Start with 1 second
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private userType: string | null = null;
  private token: string | null = null;
  private deliveryId: string | null = null;
  private storeId: string | null = null;
  private orderId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadUserData();
    }
  }

  private loadUserData() {
    if (typeof window !== "undefined") {
      // Get user data from localStorage or session
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.userId = user.id;
          this.userType = user.activeRole?.toLowerCase() || user.userType;
          this.token =
            localStorage.getItem("token") || localStorage.getItem("auth_token");
          this.storeId = user.storeId;
          this.orderId = null; // Will be set when subscribing to specific orders
        } catch (error) {
          console.error("Failed to parse user data:", error);
        }
      }
    }
  }

  private initializeWebSocket() {
    if (!this.userId || !this.userType || !this.token) {
      console.warn(
        "Missing user data for WebSocket connection - skipping connection"
      );
      return;
    }

    // Use the same base URL as the API but with ws/wss protocol
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000");
    const wsUrl = new URL(baseUrl);
    wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";

    wsUrl.searchParams.set("userId", this.userId);
    wsUrl.searchParams.set("userType", this.userType);
    wsUrl.searchParams.set("token", this.token);

    if (this.deliveryId) {
      wsUrl.searchParams.set("deliveryId", this.deliveryId);
    }
    if (this.storeId) {
      wsUrl.searchParams.set("storeId", this.storeId);
    }
    if (this.orderId) {
      wsUrl.searchParams.set("orderId", this.orderId);
    }

    console.log("Connecting to WebSocket:", wsUrl.toString());
    this.ws = new WebSocket(wsUrl.toString());

    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (this.ws?.readyState === WebSocket.CONNECTING) {
        console.warn("WebSocket connection timeout");
        this.ws.close(1000, "Connection timeout");
      }
    }, 10000); // 10 second timeout

    this.setupEventListeners();

    // Clear timeout when connection opens
    this.ws.addEventListener("open", () => {
      clearTimeout(connectionTimeout);
    });
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("Connected to WebSocket server");
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.startPingInterval();
    };

    this.ws.onclose = (event) => {
      console.log("Disconnected from WebSocket server:", event.reason);
      this.stopPingInterval();
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket connection error:", error);
      this.handleReconnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error(
          "Failed to parse WebSocket message:",
          error,
          "Raw data:",
          event.data
        );
        // Don't close connection for parse errors, just log them
      }
    };
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case "pong":
        // Handle pong response
        break;
      case "order_status_update":
        this.emit("order:update", message as OrderUpdateEvent);
        break;
      case "location_update":
        this.emit("delivery:update", message as DeliveryUpdateEvent);
        break;
      case "notification":
        this.emit("notification:new", message as NotificationEvent);
        break;
      case "payment_status_update":
        this.emit("payment:update", message);
        break;
      case "new_order":
        this.emit("order:new", message);
        break;
      case "rider_assigned":
        this.emit("rider:assigned", message);
        break;
      default:
        console.log("Unhandled message type:", message.type);
    }
  }

  private handleReconnect() {
    if (
      this.isConnecting ||
      this.reconnectAttempts >= this.maxReconnectAttempts
    )
      return;

    this.isConnecting = true;
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(
        `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );
      this.initializeWebSocket();
    }, this.reconnectInterval * this.reconnectAttempts); // Exponential backoff
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.sendMessage({ type: "ping", timestamp: new Date().toISOString() });
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendMessage(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        const messageString = JSON.stringify(message);
        // Validate that the message is valid JSON and not too large
        if (messageString.length > 1024 * 1024) {
          // 1MB limit
          console.error("WebSocket message too large:", messageString.length);
          return;
        }
        this.ws.send(messageString);
      } catch (error) {
        console.error("Failed to stringify WebSocket message:", error);
      }
    } else {
      console.warn(
        "WebSocket not connected, cannot send message:",
        message.type
      );
    }
  }

  // Public methods
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    if (this.ws?.readyState === WebSocket.CONNECTING) return; // Already connecting

    this.initializeWebSocket();
  }

  disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Event subscription system
  private eventListeners: { [event: string]: ((data: any) => void)[] } = {};

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
  }

  off(event: string, callback?: (data: any) => void): void {
    if (!this.eventListeners[event]) return;

    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(
        (cb) => cb !== callback
      );
    } else {
      delete this.eventListeners[event];
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners[event];
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Order tracking
  subscribeToOrder(orderId: string): void {
    this.orderId = orderId;
    this.sendMessage({
      type: "subscribe_order",
      data: { orderId },
    });
  }

  unsubscribeFromOrder(orderId: string): void {
    if (this.orderId === orderId) {
      this.sendMessage({
        type: "unsubscribe_order",
        data: { orderId },
      });
      this.orderId = null;
    }
  }

  // Delivery tracking
  subscribeToDelivery(deliveryId: string): void {
    this.deliveryId = deliveryId;
    // Reconnect with new delivery ID
    this.disconnect();
    this.connect();
  }

  unsubscribeFromDelivery(deliveryId: string): void {
    if (this.deliveryId === deliveryId) {
      this.deliveryId = null;
      // Reconnect without delivery ID
      this.disconnect();
      this.connect();
    }
  }

  // Location updates (for riders)
  sendLocationUpdate(location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    activity?: string;
  }): void {
    this.sendMessage({
      type: "location_update",
      location: {
        ...location,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Status updates
  sendStatusUpdate(status: string, data?: any): void {
    this.sendMessage({
      type: "status_update",
      data: { status, ...data },
    });
  }

  // Get connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionId(): string | null {
    return this.ws ? "websocket" : null;
  }

  // Update user data (call when user logs in/out)
  updateUserData(userData: {
    id: string;
    activeRole: string;
    storeId?: string;
    token?: string;
  }) {
    this.userId = userData.id;
    this.userType = userData.activeRole.toLowerCase();
    this.storeId = userData.storeId || null;
    this.token = userData.token || this.token;

    // Reconnect with new user data
    this.disconnect();
    this.connect();
  }

  // Cleanup
  destroy(): void {
    this.disconnect();
    this.eventListeners = {};
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
export { SocketService };

// React hook for using socket service
export function useSocket() {
  return socketService;
}
