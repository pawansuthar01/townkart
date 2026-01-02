import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { prisma } from "./prisma";

interface WebSocketConnection {
  ws: WebSocket;
  userId: string;
  userType: "customer" | "store_manager" | "rider" | "admin";
  deliveryId?: string;
  storeId?: string;
  orderId?: string;
}

export class DeliveryWebSocketServer {
  private connections: Map<string, WebSocketConnection[]> = new Map();
  private userConnections: Map<string, WebSocketConnection[]> = new Map();
  private storeConnections: Map<string, WebSocketConnection[]> = new Map();
  private riderConnections: Map<string, WebSocketConnection[]> = new Map();
  private wss: WebSocketServer | null = null;

  initialize(server: any) {
    // Only initialize WebSocket server in production or when explicitly enabled
    // This prevents conflicts with Next.js development HMR WebSocket
    const enableWebSocket =
      process.env.ENABLE_WEBSOCKET === "true" ||
      process.env.NODE_ENV === "production";

    if (!enableWebSocket) {
      console.log(
        "WebSocket server disabled in development (set ENABLE_WEBSOCKET=true to enable)"
      );
      return;
    }

    this.wss = new WebSocketServer({
      server,
      // Avoid conflicts with Next.js HMR by not handling HMR paths
      verifyClient: (info, callback) => {
        const url = info.req.url || "";
        // Reject webpack HMR connections to avoid conflicts
        if (url.includes("_next/webpack-hmr") || url.includes("webpack-hmr")) {
          callback(false, 403, "HMR connections not allowed");
          return;
        }
        callback(true);
      },
    });

    this.wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    console.log("✅ WebSocket server initialized (production mode)");
  }

  private async authenticateWebSocketUser(
    userId: string,
    userType: string,
    token?: string | null
  ): Promise<{ authenticated: boolean; reason?: string }> {
    try {
      // For development/testing, allow connections without token
      if (process.env.NODE_ENV === "development" && !token) {
        console.warn("WebSocket authentication bypassed in development mode");
        return { authenticated: true };
      }

      if (!token) {
        return { authenticated: false, reason: "Missing authentication token" };
      }

      // Verify user exists and has correct role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          riderProfile: userType === "rider",
          managedStores: userType === "store_manager",
        },
      });

      if (!user) {
        return { authenticated: false, reason: "User not found" };
      }

      // Check if user has the required role
      const roleMap: Record<string, string> = {
        customer: "CUSTOMER",
        store_manager: "STORE_MANAGER",
        rider: "RIDER",
        admin: "ADMIN",
      };

      const requiredRole = roleMap[userType];
      if (
        !requiredRole ||
        !user.userRoles.some((role) => role === requiredRole)
      ) {
        return {
          authenticated: false,
          reason: "Invalid user type for this user",
        };
      }

      // Additional checks based on user type
      if (userType === "store_manager" && !user.managedStores?.length) {
        return {
          authenticated: false,
          reason: "Store manager has no associated store",
        };
      }

      if (userType === "rider" && !user.riderProfile) {
        return { authenticated: false, reason: "Rider profile not found" };
      }

      // Verify session token
      const session = await prisma.session.findFirst({
        where: {
          userId: userId,
          sessionToken: token,
          isActive: true,
          expires: {
            gt: new Date(),
          },
        },
      });

      if (!session) {
        return { authenticated: false, reason: "Invalid or expired session" };
      }

      return { authenticated: true };
    } catch (error) {
      console.error("WebSocket authentication error:", error);
      return { authenticated: false, reason: "Authentication service error" };
    }
  }

  private async handleConnection(ws: WebSocket, request: IncomingMessage) {
    const url = new URL(request.url || "", "http://localhost");
    const deliveryId = url.searchParams.get("deliveryId");
    const orderId = url.searchParams.get("orderId");
    const storeId = url.searchParams.get("storeId");
    const userId = url.searchParams.get("userId");
    const userType = url.searchParams.get("userType") as
      | "customer"
      | "store_manager"
      | "rider"
      | "admin";
    const token = url.searchParams.get("token");

    if (!userId || !userType) {
      ws.close(1008, "Missing userId or userType");
      return;
    }

    // Authenticate user
    const authResult = await this.authenticateWebSocketUser(
      userId,
      userType,
      token
    );
    if (!authResult.authenticated) {
      ws.close(1008, authResult.reason || "Authentication failed");
      return;
    }

    const connection: WebSocketConnection = {
      ws,
      userId,
      userType,
      deliveryId: deliveryId || undefined,
      storeId: storeId || undefined,
      orderId: orderId || undefined,
    };

    // Add to user connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, []);
    }
    this.userConnections.get(userId)!.push(connection);

    // Add to type-specific connections
    if (userType === "store_manager" && storeId) {
      if (!this.storeConnections.has(storeId)) {
        this.storeConnections.set(storeId, []);
      }
      this.storeConnections.get(storeId)!.push(connection);
    }

    if (userType === "rider") {
      if (!this.riderConnections.has(userId)) {
        this.riderConnections.set(userId, []);
      }
      this.riderConnections.get(userId)!.push(connection);
    }

    // Add to delivery room if deliveryId is provided
    if (deliveryId) {
      if (!this.connections.has(deliveryId)) {
        this.connections.set(deliveryId, []);
      }
      this.connections.get(deliveryId)!.push(connection);
    }

    console.log(
      `WebSocket connected: ${userType} ${userId} ${deliveryId ? `for delivery ${deliveryId}` : ""} ${storeId ? `for store ${storeId}` : ""}`
    );

    // Send initial state if deliveryId is provided
    if (deliveryId) {
      this.sendInitialState(ws, deliveryId, userId, userType);
    }

    // Handle disconnection
    ws.on("close", () => {
      this.removeConnection(deliveryId, connection);
    });

    // Handle messages
    ws.on("message", (data) => {
      try {
        const rawData = data.toString();
        // Validate message size (prevent DoS)
        if (rawData.length > 1024 * 1024) {
          // 1MB limit
          console.error("WebSocket message too large from", connection.userId);
          return;
        }

        const message = JSON.parse(rawData);
        this.handleMessage(connection, message);
      } catch (error) {
        console.error(
          "Invalid WebSocket message from",
          connection.userId,
          ":",
          error
        );
        // Don't close connection for invalid messages, just log
      }
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      this.removeConnection(deliveryId, connection);
    });
  }

  private async sendInitialState(
    ws: WebSocket,
    deliveryId: string,
    userId: string,
    userType: string
  ) {
    try {
      // Import delivery service to get current state
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          order: {
            include: {
              customer: { select: { id: true, fullName: true } },
              store: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  latitude: true,
                  longitude: true,
                },
              },
            },
          },
          rider: {
            select: {
              id: true,
              user: { select: { fullName: true } },
              currentLat: true,
              currentLng: true,
              lastLocationUpdate: true,
            },
          },
        },
      });

      if (delivery) {
        // Filter data based on user type for privacy
        let deliveryState: any = {
          id: delivery.id,
          status: delivery.deliveryStatus,
          pickupTime: delivery.pickupTime,
          deliveryTime: delivery.deliveryTime,
          estimatedPickupTime: delivery.estimatedPickupTime,
          estimatedDeliveryTime: delivery.estimatedDeliveryTime,
          order: {
            orderNumber: delivery.order.orderNumber,
            merchant: delivery.order.store,
          },
        };

        // Add rider info for customers and admins
        if (userType === "customer" || userType === "admin") {
          deliveryState.rider = delivery.rider
            ? {
                id: delivery.rider.id,
                name: delivery.rider.user.fullName,
                location:
                  delivery.rider.currentLat && delivery.rider.currentLng
                    ? {
                        latitude: delivery.rider.currentLat,
                        longitude: delivery.rider.currentLng,
                        lastUpdate: delivery.rider.lastLocationUpdate,
                      }
                    : null,
              }
            : null;
        }

        // Add customer info for riders and admins
        if (userType === "rider" || userType === "admin") {
          deliveryState.customer = delivery.order.customer;
        }

        this.sendToConnection(ws, {
          type: "delivery_state",
          data: deliveryState,
        });
      }

      await prisma.$disconnect();
    } catch (error) {
      console.error("Error sending initial state:", error);
    }
  }

  private handleMessage(connection: WebSocketConnection, message: any) {
    switch (message.type) {
      case "ping":
        this.sendToConnection(connection.ws, {
          type: "pong",
          timestamp: new Date(),
          serverTime: new Date().toISOString(),
        });
        break;
      case "location_update":
        // Handle location updates from different user types
        if (connection.userType === "rider") {
          this.handleRiderLocationUpdate(connection, message.location);
        } else if (connection.userType === "customer") {
          this.handleCustomerLocationUpdate(connection, message.location);
        } else if (connection.userType === "store_manager") {
          this.handleStoreLocationUpdate(connection, message.location);
        }
        break;
      case "subscribe_order":
        // Subscribe to order updates
        if (message.orderId) {
          connection.orderId = message.orderId;
          this.sendToConnection(connection.ws, {
            type: "subscription_confirmed",
            orderId: message.orderId,
            timestamp: new Date(),
          });
        }
        break;
      case "unsubscribe_order":
        // Unsubscribe from order updates
        if (connection.orderId === message.orderId) {
          connection.orderId = undefined;
        }
        break;
      default:
        console.log("Unknown message type:", message.type);
    }
  }

  private async handleRiderLocationUpdate(
    connection: WebSocketConnection,
    location: any
  ) {
    try {
      // Update rider location in database
      await prisma.riderProfile.update({
        where: { userId: connection.userId },
        data: {
          currentLat: location.latitude,
          currentLng: location.longitude,
          lastLocationUpdate: new Date(),
        },
      });

      // Create location log
      await prisma.riderLocation.create({
        data: {
          riderId: connection.userId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          speed: location.speed,
          heading: location.heading,
          activity: location.activity || "moving",
          batteryLevel: location.batteryLevel,
        },
      });

      // Broadcast location update to relevant deliveries
      if (connection.deliveryId) {
        this.broadcastToDelivery(connection.deliveryId, {
          type: "location_update",
          riderId: connection.userId,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: new Date(),
            accuracy: location.accuracy,
            speed: location.speed,
          },
        });
      }

      // Broadcast to stores with active deliveries for this rider
      this.broadcastRiderLocationToStores(connection.userId, {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
        accuracy: location.accuracy,
      });
    } catch (error) {
      console.error("Error handling rider location update:", error);
    }
  }

  private async handleCustomerLocationUpdate(
    connection: WebSocketConnection,
    location: any
  ) {
    try {
      // Log customer location update
      await prisma.locationDataRecord.create({
        data: {
          userId: connection.userId,
          consentId: "customer_location_tracking", // This needs to be created in DB
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date(),
          purpose: "customer_location_tracking",
          collectedAt: new Date(),
          retentionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          isAnonymized: false,
          source: "customer_app",
        },
      });

      // Broadcast customer location to relevant parties (admins, support)
      this.broadcastToAdmins({
        type: "customer_location_update",
        customerId: connection.userId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
          accuracy: location.accuracy,
        },
      });

      console.log(
        `Customer ${connection.userId} location updated: ${location.latitude}, ${location.longitude}`
      );
    } catch (error) {
      console.error("Error handling customer location update:", error);
    }
  }

  private async handleStoreLocationUpdate(
    connection: WebSocketConnection,
    location: any
  ) {
    try {
      // Find store managed by this user
      const store = await prisma.store.findFirst({
        where: {
          managerId: connection.userId,
          isActive: true,
        },
      });

      if (!store) {
        console.error(`No active store found for manager ${connection.userId}`);
        return;
      }

      // Update store location
      await prisma.store.update({
        where: { id: store.id },
        data: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      // Log store location update
      await prisma.locationDataRecord.create({
        data: {
          userId: connection.userId,
          consentId: "store_location_tracking", // This needs to be created in DB
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date(),
          purpose: "store_location_tracking",
          collectedAt: new Date(),
          retentionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          isAnonymized: false,
          source: "store_app",
        },
      });

      // Broadcast store location to relevant parties (admins, riders with deliveries)
      this.broadcastToAdmins({
        type: "store_location_update",
        storeId: store.id,
        storeName: store.name,
        managerId: connection.userId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: new Date(),
          accuracy: location.accuracy,
        },
      });

      console.log(
        `Store ${store.name} (${store.id}) location updated: ${location.latitude}, ${location.longitude}`
      );
    } catch (error) {
      console.error("Error handling store location update:", error);
    }
  }
  broadcastToDelivery(deliveryId: string, message: any) {
    const connections = this.connections.get(deliveryId) || [];
    connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        this.sendToConnection(connection.ws, message);
      }
    });
  }

  broadcastToUser(userId: string, message: any) {
    // Find all connections for this user across all deliveries
    for (const connections of Array.from(this.connections.values())) {
      connections.forEach((connection: WebSocketConnection) => {
        if (
          connection.userId === userId &&
          connection.ws.readyState === WebSocket.OPEN
        ) {
          this.sendToConnection(connection.ws, message);
        }
      });
    }
  }

  // Broadcast to all users in a store
  broadcastToStore(storeId: string, message: any) {
    const connections = this.storeConnections.get(storeId) || [];
    connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        this.sendToConnection(connection.ws, message);
      }
    });
  }

  // Broadcast to a specific rider
  broadcastToRider(riderId: string, message: any) {
    const connections = this.riderConnections.get(riderId) || [];
    connections.forEach((connection) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        this.sendToConnection(connection.ws, message);
      }
    });
  }

  // Broadcast to all admin users
  broadcastToAdmins(message: any) {
    for (const connections of Array.from(this.userConnections.values())) {
      connections.forEach((connection: WebSocketConnection) => {
        if (
          connection.userType === "admin" &&
          connection.ws.readyState === WebSocket.OPEN
        ) {
          this.sendToConnection(connection.ws, message);
        }
      });
    }
  }

  // Broadcast system status updates to admins
  broadcastSystemStatusUpdate(statusData: any) {
    const message = {
      type: "system_status_update",
      data: statusData,
      timestamp: new Date(),
    };
    this.broadcastToAdmins(message);
  }

  // Broadcast new user registration to admins
  broadcastNewUserRegistration(userData: any) {
    const message = {
      type: "new_user_registration",
      user: userData,
      timestamp: new Date(),
    };
    this.broadcastToAdmins(message);
  }

  // Broadcast payment events to admins
  broadcastPaymentEvent(paymentData: any) {
    const message = {
      type: "payment_event",
      payment: paymentData,
      timestamp: new Date(),
    };
    this.broadcastToAdmins(message);
  }

  // Broadcast order status updates
  broadcastOrderStatus(orderId: string, status: string, data?: any) {
    const message = {
      type: "order_status_update",
      orderId,
      status,
      data,
      timestamp: new Date(),
    };

    // Broadcast to order-related connections
    this.broadcastToDelivery(orderId, message);

    // Also broadcast to user connections if they have this order
    for (const [userId, connections] of Array.from(
      this.userConnections.entries()
    )) {
      connections.forEach((connection) => {
        if (
          connection.orderId === orderId &&
          connection.ws.readyState === WebSocket.OPEN
        ) {
          this.sendToConnection(connection.ws, message);
        }
      });
    }
  }

  // Broadcast new order to store
  broadcastNewOrderToStore(storeId: string, orderData: any) {
    const message = {
      type: "new_order",
      storeId,
      order: orderData,
      timestamp: new Date(),
    };

    this.broadcastToStore(storeId, message);
  }

  // Broadcast rider assignment
  broadcastRiderAssignment(orderId: string, riderData: any) {
    const message = {
      type: "rider_assigned",
      orderId,
      rider: riderData,
      timestamp: new Date(),
    };

    this.broadcastToDelivery(orderId, message);
  }

  // Broadcast available deliveries to riders
  broadcastAvailableDeliveries(riderIds: string[], deliveries: any[]) {
    const message = {
      type: "available_deliveries",
      deliveries,
      timestamp: new Date(),
    };

    riderIds.forEach((riderId) => {
      this.broadcastToRider(riderId, message);
    });
  }

  // Broadcast rider location updates to stores
  broadcastRiderLocationToStores(riderId: string, locationData: any) {
    // Find all active deliveries for this rider
    // We'll need to query the database to find which stores have active orders with this rider
    this.broadcastRiderLocationUpdate(riderId, locationData);
  }

  // Broadcast rider location update to all relevant stores
  private async broadcastRiderLocationUpdate(
    riderId: string,
    locationData: any
  ) {
    try {
      // Find all active deliveries for this rider
      const activeDeliveries = await prisma.delivery.findMany({
        where: {
          riderId: riderId,
          deliveryStatus: {
            in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"],
          },
        },
        include: {
          order: {
            select: {
              storeId: true,
            },
          },
        },
      });

      // Get unique store IDs
      const storeIds = Array.from(
        new Set(activeDeliveries.map((d) => d.order.storeId))
      );

      const message = {
        type: "rider_location_update",
        riderId,
        location: locationData,
        timestamp: new Date(),
      };

      // Broadcast to each store
      storeIds.forEach((storeId) => {
        this.broadcastToStore(storeId, message);
      });

      await prisma.$disconnect();
    } catch (error) {
      console.error("Error broadcasting rider location update:", error);
    }
  }

  private sendToConnection(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private removeConnection(
    deliveryId: string | null,
    connection: WebSocketConnection
  ) {
    const { userId, storeId } = connection;

    // Remove from delivery connections
    if (deliveryId && this.connections.has(deliveryId)) {
      const connections = this.connections.get(deliveryId)!;
      const index = connections.indexOf(connection);
      if (index > -1) {
        connections.splice(index, 1);
        if (connections.length === 0) {
          this.connections.delete(deliveryId);
        }
      }
    }

    // Remove from user connections
    if (this.userConnections.has(userId)) {
      const userConns = this.userConnections.get(userId)!;
      const userIndex = userConns.indexOf(connection);
      if (userIndex > -1) {
        userConns.splice(userIndex, 1);
        if (userConns.length === 0) {
          this.userConnections.delete(userId);
        }
      }
    }

    // Remove from store connections
    if (storeId && this.storeConnections.has(storeId)) {
      const storeConns = this.storeConnections.get(storeId)!;
      const storeIndex = storeConns.indexOf(connection);
      if (storeIndex > -1) {
        storeConns.splice(storeIndex, 1);
        if (storeConns.length === 0) {
          this.storeConnections.delete(storeId);
        }
      }
    }

    // Remove from rider connections
    if (connection.userType === "rider" && this.riderConnections.has(userId)) {
      const riderConns = this.riderConnections.get(userId)!;
      const riderIndex = riderConns.indexOf(connection);
      if (riderIndex > -1) {
        riderConns.splice(riderIndex, 1);
        if (riderConns.length === 0) {
          this.riderConnections.delete(userId);
        }
      }
    }

    console.log(
      `WebSocket disconnected: ${connection.userType} ${connection.userId}`
    );
  }

  // Get connection stats
  getStats() {
    const deliveryStats: { [deliveryId: string]: number } = {};
    for (const [deliveryId, connections] of Array.from(
      this.connections.entries()
    )) {
      deliveryStats[deliveryId] = connections.length;
    }

    const storeStats: { [storeId: string]: number } = {};
    for (const [storeId, connections] of Array.from(
      this.storeConnections.entries()
    )) {
      storeStats[storeId] = connections.length;
    }

    const riderStats: { [riderId: string]: number } = {};
    for (const [riderId, connections] of Array.from(
      this.riderConnections.entries()
    )) {
      riderStats[riderId] = connections.length;
    }

    return {
      totalDeliveries: this.connections.size,
      totalStores: this.storeConnections.size,
      totalRiders: this.riderConnections.size,
      totalUsers: this.userConnections.size,
      totalConnections: Array.from(this.userConnections.values()).reduce(
        (sum, conns) => sum + conns.length,
        0
      ),
      deliveries: deliveryStats,
      stores: storeStats,
      riders: riderStats,
    };
  }
}

// Order status change broadcaster
export async function broadcastOrderStatusChange(
  orderId: string,
  newStatus: string,
  data?: any
) {
  try {
    // Import notification manager to send notifications
    const { notificationManager } = await import("./notificationSystem");

    // Send notification based on status
    const customerId = data?.customerId;
    const storeId = data?.storeId;
    const riderId = data?.riderId;

    // Notify customer
    if (customerId) {
      await notificationManager.sendNotification(
        customerId,
        "order_status_update",
        {
          orderId,
          status: newStatus,
          ...data,
        }
      );
    }

    // Notify store for relevant statuses
    if (
      storeId &&
      ["STORE_ASSIGNED", "READY_FOR_PICKUP", "DELIVERED"].includes(newStatus)
    ) {
      // Broadcast to store via WebSocket
      wsServer.broadcastToStore(storeId, {
        type: "order_status_update",
        orderId,
        status: newStatus,
        data,
        timestamp: new Date(),
      });
    }

    // Notify rider for relevant statuses
    if (
      riderId &&
      ["RIDER_ASSIGNED", "EN_ROUTE", "DELIVERED"].includes(newStatus)
    ) {
      wsServer.broadcastToRider(riderId, {
        type: "order_status_update",
        orderId,
        status: newStatus,
        data,
        timestamp: new Date(),
      });
    }

    // Broadcast general order status update
    wsServer.broadcastOrderStatus(orderId, newStatus, data);
  } catch (error) {
    console.error("Error broadcasting order status change:", error);
  }
}

// Export singleton instance
export const wsServer = new DeliveryWebSocketServer();
