import { useState, useEffect, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: any;
}

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    socketRef.current = io(url, {
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));
      reconnectCountRef.current = 0;
    });

    socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
      }));

      // Attempt to reconnect if not manually disconnected
      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect"
      ) {
        attemptReconnect();
      }
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error.message,
      }));
      attemptReconnect();
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("WebSocket reconnected after", attemptNumber, "attempts");
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null,
      }));
    });

    socket.on("reconnect_error", (error) => {
      console.error("WebSocket reconnection error:", error);
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    });
  }, [url]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      lastMessage: null,
    });
  }, []);

  // Attempt to reconnect
  const attemptReconnect = useCallback(() => {
    if (reconnectCountRef.current >= reconnectAttempts) {
      console.log("Max reconnection attempts reached");
      return;
    }

    reconnectCountRef.current += 1;
    console.log(
      `Attempting to reconnect (${reconnectCountRef.current}/${reconnectAttempts})...`,
    );

    setState((prev) => ({ ...prev, isConnecting: true }));

    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    }, reconnectInterval);
  }, [reconnectAttempts, reconnectInterval]);

  // Send message
  const sendMessage = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(
        "WebSocket is not connected. Message not sent:",
        event,
        data,
      );
    }
  }, []);

  // Listen to events
  const onMessage = useCallback(
    (event: string, callback: (data: any) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, (data) => {
          setState((prev) => ({ ...prev, lastMessage: { event, data } }));
          callback(data);
        });
      }

      // Return cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, callback);
        }
      };
    },
    [],
  );

  // Remove event listener
  const offMessage = useCallback(
    (event: string, callback?: (data: any) => void) => {
      if (socketRef.current) {
        if (callback) {
          socketRef.current.off(event, callback);
        } else {
          socketRef.current.off(event);
        }
      }
    },
    [],
  );

  // Join room/channel
  const joinRoom = useCallback(
    (roomId: string) => {
      sendMessage("join_room", { roomId });
    },
    [sendMessage],
  );

  // Leave room/channel
  const leaveRoom = useCallback(
    (roomId: string) => {
      sendMessage("leave_room", { roomId });
    },
    [sendMessage],
  );

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    lastMessage: state.lastMessage,

    // Actions
    connect,
    disconnect,
    sendMessage,
    onMessage,
    offMessage,
    joinRoom,
    leaveRoom,

    // Socket instance (for advanced usage)
    socket: socketRef.current,
  };
};

// Specialized hooks for common use cases
export const useOrderTracking = (orderId?: string) => {
  const { onMessage, sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (orderId && isConnected) {
      // Join order tracking room
      sendMessage("join_order_tracking", { orderId });

      // Listen for order updates
      const cleanup = onMessage("order_update", (data) => {
        console.log("Order update received:", data);
        // Handle order update
      });

      return cleanup;
    }
  }, [orderId, isConnected, sendMessage, onMessage]);

  return { isConnected };
};

export const useDeliveryTracking = (deliveryId?: string) => {
  const { onMessage, sendMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (deliveryId && isConnected) {
      // Join delivery tracking room
      sendMessage("join_delivery_tracking", { deliveryId });

      // Listen for location updates
      const cleanup = onMessage("location_update", (data) => {
        console.log("Location update received:", data);
        // Handle location update
      });

      return cleanup;
    }
  }, [deliveryId, isConnected, sendMessage, onMessage]);

  return { isConnected };
};

export const useNotifications = () => {
  const { onMessage, isConnected } = useWebSocket();

  useEffect(() => {
    if (isConnected) {
      // Listen for notifications
      const cleanup = onMessage("notification", (data) => {
        console.log("Notification received:", data);
        // Handle notification (show toast, etc.)
      });

      return cleanup;
    }
  }, [isConnected, onMessage]);

  return { isConnected };
};
