import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { parse } from "url";
import jwt from "jsonwebtoken";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  deliveryId?: string;
  data?: any;
  timestamp?: Date;
}

class DeliveryWebSocketServer {
  private wss: WebSocketServer;
  private connections: Map<string, Set<ExtendedWebSocket>> = new Map(); // deliveryId -> Set of WebSockets
  private userConnections: Map<string, ExtendedWebSocket> = new Map(); // userId -> WebSocket

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });

    this.wss.on(
      "connection",
      (ws: ExtendedWebSocket, request: IncomingMessage) => {
        this.handleConnection(ws, request);
      }
    );

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.wss.clients.forEach((ws: ExtendedWebSocket) => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    console.log(`WebSocket server started on port ${port}`);
  }

  private async handleConnection(
    ws: ExtendedWebSocket,
    request: IncomingMessage
  ) {
    try {
      // Extract token from query parameters
      const { query } = parse(request.url || "", true);
      const token = query.token as string;

      if (!token) {
        ws.close(1008, "Authentication required");
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as any;
      ws.userId = decoded.userId;
      ws.userRole = decoded.role;
      ws.isAlive = true;

      // Store user connection
      this.userConnections.set(ws.userId!, ws);

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("Invalid message format:", error);
        }
      });

      ws.on("close", () => {
        this.handleDisconnection(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.handleDisconnection(ws);
      });

      // Send welcome message
      this.sendToWebSocket(ws, {
        type: "connected",
        message: "Successfully connected to delivery tracking",
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Connection authentication failed:", error);
      ws.close(1008, "Authentication failed");
    }
  }

  private handleMessage(ws: ExtendedWebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case "subscribe_delivery":
        if (message.deliveryId) {
          this.subscribeToDelivery(ws, message.deliveryId);
        }
        break;

      case "unsubscribe_delivery":
        if (message.deliveryId) {
          this.unsubscribeFromDelivery(ws, message.deliveryId);
        }
        break;

      case "ping":
        this.sendToWebSocket(ws, {
          type: "pong",
          timestamp: new Date(),
        });
        break;

      default:
        console.log("Unknown message type:", message.type);
    }
  }

  private subscribeToDelivery(ws: ExtendedWebSocket, deliveryId: string) {
    if (!this.connections.has(deliveryId)) {
      this.connections.set(deliveryId, new Set());
    }
    this.connections.get(deliveryId)!.add(ws);

    this.sendToWebSocket(ws, {
      type: "subscribed",
      deliveryId,
      message: `Subscribed to delivery ${deliveryId}`,
      timestamp: new Date(),
    });
  }

  private unsubscribeFromDelivery(ws: ExtendedWebSocket, deliveryId: string) {
    const deliveryConnections = this.connections.get(deliveryId);
    if (deliveryConnections) {
      deliveryConnections.delete(ws);
      if (deliveryConnections.size === 0) {
        this.connections.delete(deliveryId);
      }
    }
  }

  private handleDisconnection(ws: ExtendedWebSocket) {
    // Remove from all delivery subscriptions
    for (const [deliveryId, connections] of this.connections.entries() as any) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.connections.delete(deliveryId);
      }
    }

    // Remove user connection
    if (ws.userId) {
      this.userConnections.delete(ws.userId);
    }
  }

  // Public methods for broadcasting updates
  broadcastToDelivery(deliveryId: string, message: WebSocketMessage) {
    const connections = this.connections.get(deliveryId);
    if (connections) {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date(),
      };

      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendToWebSocket(ws, messageWithTimestamp);
        }
      });
    }
  }

  broadcastToUser(userId: string, message: WebSocketMessage) {
    const ws = this.userConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      this.sendToWebSocket(ws, {
        ...message,
        timestamp: new Date(),
      });
    }
  }

  private sendToWebSocket(ws: ExtendedWebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Get connection stats
  getStats() {
    return {
      totalConnections: this.wss.clients.size,
      activeDeliveries: this.connections.size,
      userConnections: this.userConnections.size,
    };
  }
}

// Export singleton instance
export const wsServer = new DeliveryWebSocketServer(8080);

// Export types and utilities
export type { WebSocketMessage, ExtendedWebSocket };
