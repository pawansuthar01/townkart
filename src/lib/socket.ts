import { io, Socket } from 'socket.io-client'
import { WebSocketMessage, OrderUpdateEvent, DeliveryUpdateEvent, NotificationEvent } from '@/types/api.types'

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 1000 // Start with 1 second
  private isConnecting = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeSocket()
    }
  }

  private initializeSocket() {
    const token = this.getAuthToken()
    if (!token) return

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      this.reconnectAttempts = 0
      this.isConnecting = false
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason)
      this.handleReconnect()
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.handleReconnect()
    })

    // Order events
    this.socket.on('order:update', (data: OrderUpdateEvent['data']) => {
      this.emit('order:update', data)
    })

    // Delivery events
    this.socket.on('delivery:update', (data: DeliveryUpdateEvent['data']) => {
      this.emit('delivery:update', data)
    })

    // Notification events
    this.socket.on('notification:new', (data: NotificationEvent['data']) => {
      this.emit('notification:new', data)
    })

    // Error handling
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    })
  }

  private handleReconnect() {
    if (this.isConnecting || this.reconnectAttempts >= this.maxReconnectAttempts) return

    this.isConnecting = true
    this.reconnectAttempts++

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.initializeSocket()
    }, this.reconnectInterval * this.reconnectAttempts) // Exponential backoff
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  // Public methods
  connect(): void {
    if (this.socket?.connected) return

    this.initializeSocket()
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Event subscription system
  private eventListeners: { [event: string]: ((data: any) => void)[] } = {}

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  off(event: string, callback?: (data: any) => void): void {
    if (!this.eventListeners[event]) return

    if (callback) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback)
    } else {
      delete this.eventListeners[event]
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners[event]
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  // Socket.io methods
  emitToServer(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('Socket not connected. Unable to emit:', event)
    }
  }

  // Order tracking
  subscribeToOrder(orderId: string): void {
    this.emitToServer('subscribe:order', { orderId })
  }

  unsubscribeFromOrder(orderId: string): void {
    this.emitToServer('unsubscribe:order', { orderId })
  }

  // Delivery tracking
  subscribeToDelivery(deliveryId: string): void {
    this.emitToServer('subscribe:delivery', { deliveryId })
  }

  unsubscribeFromDelivery(deliveryId: string): void {
    this.emitToServer('unsubscribe:delivery', { deliveryId })
  }

  // Location updates (for riders)
  sendLocationUpdate(location: { latitude: number; longitude: number }): void {
    this.emitToServer('rider:location', location)
  }

  // Status updates
  sendStatusUpdate(status: string, data?: any): void {
    this.emitToServer('status:update', { status, ...data })
  }

  // Get connection status
  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  get connectionId(): string | null {
    return this.socket?.id ?? null
  }

  // Cleanup
  destroy(): void {
    this.disconnect()
    this.eventListeners = {}
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService
export { SocketService }

// React hook for using socket service
export function useSocket() {
  return socketService
}

// Higher-order component for socket subscription
export function withSocketSubscription<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  subscriptions: string[]
) {
  return function SocketSubscribedComponent(props: P) {
    React.useEffect(() => {
      // Setup subscriptions
      subscriptions.forEach(event => {
        // Setup event listeners if needed
      })

      return () => {
        // Cleanup subscriptions
        subscriptions.forEach(event => {
          // Remove event listeners if needed
        })
      }
    }, [])

    return <WrappedComponent {...props} />
  }
}