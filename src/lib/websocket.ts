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
    this.wss = new WebSocketServer({ server });

    this.wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    console.log("WebSocket server initialized");
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage) {
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

    if (!userId || !userType) {
      ws.close(1008, "Missing userId or userType");
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
      `WebSocket connected: ${userType} ${userId} ${deliveryId ? `for delivery ${deliveryId}` : ""} ${storeId ? `for store ${storeId}` : ""}`,
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
        const message = JSON.parse(data.toString());
        this.handleMessage(connection, message);
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
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
    userType: string,
  ) {
    try {
      // Import delivery service to get current state
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          order: {
            include: {
              customer: { select: { id: true, fullName: true } },
              merchant: {
                select: {
                  id: true,
                  businessName: true,
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
            merchant: delivery.order.merchant,
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
        });
        break;
      case "location_update":
        // Handle location updates from riders
        if (connection.userType === "rider" && connection.deliveryId) {
          this.broadcastToDelivery(connection.deliveryId, {
            type: "location_update",
            riderId: connection.userId,
            location: message.location,
            timestamp: new Date(),
          });
        }
        break;
      default:
        console.log("Unknown message type:", message.type);
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
      this.userConnections.entries(),
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
    locationData: any,
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
        new Set(activeDeliveries.map((d) => d.order.storeId)),
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
    connection: WebSocketConnection,
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
      `WebSocket disconnected: ${connection.userType} ${connection.userId}`,
    );
  }

  // Get connection stats
  getStats() {
    const deliveryStats: { [deliveryId: string]: number } = {};
    for (const [deliveryId, connections] of Array.from(
      this.connections.entries(),
    )) {
      deliveryStats[deliveryId] = connections.length;
    }

    const storeStats: { [storeId: string]: number } = {};
    for (const [storeId, connections] of Array.from(
      this.storeConnections.entries(),
    )) {
      storeStats[storeId] = connections.length;
    }

    const riderStats: { [riderId: string]: number } = {};
    for (const [riderId, connections] of Array.from(
      this.riderConnections.entries(),
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
        0,
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
  data?: any,
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
        },
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
