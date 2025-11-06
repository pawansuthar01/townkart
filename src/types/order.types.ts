import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client'

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customer: any // User
  merchantId: string
  merchant: any // MerchantProfile
  totalAmount: number
  deliveryFee: number
  taxAmount: number
  discountAmount: number
  finalAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  deliveryAddress: any // Address or JSON
  specialInstructions: string | null
  createdAt: Date
  updatedAt: Date
  deliveredAt: Date | null
}

export interface OrderItem {
  id: string
  orderId: string
  order: Order
  productId: string
  product: any // Product
  productSnapshot: any // JSON snapshot of product at order time
  quantity: number
  unitPrice: number
  subtotal: number
  createdAt: Date
}

export interface OrderWithItems extends Order {
  orderItems: OrderItem[]
  delivery?: any // Delivery
  payment?: any // Payment
  review?: any // Review
}

export interface CreateOrderRequest {
  merchantId: string
  items: {
    productId: string
    quantity: number
  }[]
  deliveryAddress: {
    line1: string
    line2?: string
    landmark?: string
    city: string
    state: string
    pincode: string
    latitude?: number
    longitude?: number
  }
  paymentMethod: PaymentMethod
  specialInstructions?: string
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
}

export interface OrderSearchFilters {
  customerId?: string
  merchantId?: string
  riderId?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
  sortBy?: 'newest' | 'oldest' | 'amount_asc' | 'amount_desc'
  page?: number
  limit?: number
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersByStatus: Record<OrderStatus, number>
  ordersByPaymentMethod: Record<PaymentMethod, number>
  dailyOrders: { date: string; count: number; revenue: number }[]
  topProducts: { productId: string; productName: string; quantity: number }[]
}

export interface OrderDashboardData {
  recentOrders: OrderWithItems[]
  stats: OrderStats
  pendingOrders: OrderWithItems[]
  todayOrders: OrderWithItems[]
  monthlyRevenue: number
  monthlyOrders: number
}

// Order status helpers
export function getOrderStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return 'text-yellow-600 bg-yellow-100'
    case 'CONFIRMED':
      return 'text-blue-600 bg-blue-100'
    case 'PREPARING':
      return 'text-orange-600 bg-orange-100'
    case 'READY_FOR_PICKUP':
      return 'text-purple-600 bg-purple-100'
    case 'OUT_FOR_DELIVERY':
      return 'text-indigo-600 bg-indigo-100'
    case 'DELIVERED':
      return 'text-green-600 bg-green-100'
    case 'CANCELLED':
      return 'text-red-600 bg-red-100'
    case 'REFUNDED':
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getOrderStatusText(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return 'Pending Confirmation'
    case 'CONFIRMED':
      return 'Confirmed'
    case 'PREPARING':
      return 'Preparing'
    case 'READY_FOR_PICKUP':
      return 'Ready for Pickup'
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery'
    case 'DELIVERED':
      return 'Delivered'
    case 'CANCELLED':
      return 'Cancelled'
    case 'REFUNDED':
      return 'Refunded'
    default:
      return status
  }
}

export function getOrderStatusIcon(status: OrderStatus): string {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return '⏳'
    case 'CONFIRMED':
      return '✅'
    case 'PREPARING':
      return '👨‍🍳'
    case 'READY_FOR_PICKUP':
      return '📦'
    case 'OUT_FOR_DELIVERY':
      return '🚴'
    case 'DELIVERED':
      return '🎉'
    case 'CANCELLED':
      return '❌'
    case 'REFUNDED':
      return '💰'
    default:
      return '📋'
  }
}

export function canCancelOrder(status: OrderStatus): boolean {
  return ['PENDING_CONFIRMATION', 'CONFIRMED'].includes(status)
}

export function canUpdateOrderStatus(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  const statusFlow: Record<OrderStatus, OrderStatus[]> = {
    PENDING_CONFIRMATION: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
    READY_FOR_PICKUP: ['OUT_FOR_DELIVERY', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  }

  return statusFlow[currentStatus]?.includes(newStatus) ?? false
}

// Payment status helpers
export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-100'
    case 'COMPLETED':
      return 'text-green-600 bg-green-100'
    case 'FAILED':
      return 'text-red-600 bg-red-100'
    case 'REFUNDED':
      return 'text-blue-600 bg-blue-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getPaymentStatusText(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'Pending'
    case 'COMPLETED':
      return 'Completed'
    case 'FAILED':
      return 'Failed'
    case 'REFUNDED':
      return 'Refunded'
    default:
      return status
  }
}

// Order calculation helpers
export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.subtotal, 0)
}

export function calculateDeliveryFee(distance: number): number {
  const baseFee = 20
  const perKmFee = 5
  return baseFee + Math.ceil(distance) * perKmFee
}

export function calculateTax(amount: number, taxRate: number = 0.05): number {
  return Math.round(amount * taxRate * 100) / 100
}

export function calculateDiscount(amount: number, discountPercent: number): number {
  return Math.round(amount * (discountPercent / 100) * 100) / 100
}

export function calculateFinalAmount(
  subtotal: number,
  deliveryFee: number,
  taxAmount: number,
  discountAmount: number
): number {
  return subtotal + deliveryFee + taxAmount - discountAmount
}

// Order validation
export function validateOrderData(data: CreateOrderRequest): string[] {
  const errors: string[] = []

  if (!data.merchantId) {
    errors.push('Merchant ID is required')
  }

  if (!data.items || data.items.length === 0) {
    errors.push('At least one item is required')
  } else {
    data.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product ID is required`)
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }
    })
  }

  if (!data.deliveryAddress) {
    errors.push('Delivery address is required')
  } else {
    const address = data.deliveryAddress
    if (!address.line1) errors.push('Address line 1 is required')
    if (!address.city) errors.push('City is required')
    if (!address.state) errors.push('State is required')
    if (!address.pincode) errors.push('Pincode is required')
  }

  if (!data.paymentMethod) {
    errors.push('Payment method is required')
  }

  return errors
}

// Order search and filtering
export function matchesOrderFilters(order: Order, filters: OrderSearchFilters): boolean {
  if (filters.customerId && order.customerId !== filters.customerId) return false
  if (filters.merchantId && order.merchantId !== filters.merchantId) return false
  if (filters.status && order.orderStatus !== filters.status) return false
  if (filters.paymentStatus && order.paymentStatus !== filters.paymentStatus) return false
  if (filters.dateFrom && new Date(order.createdAt) < filters.dateFrom) return false
  if (filters.dateTo && new Date(order.createdAt) > filters.dateTo) return false
  if (filters.minAmount && order.finalAmount < filters.minAmount) return false
  if (filters.maxAmount && order.finalAmount > filters.maxAmount) return false

  return true
}

export function sortOrders(orders: Order[], sortBy: string): Order[] {
  return [...orders].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'amount_asc':
        return a.finalAmount - b.finalAmount
      case 'amount_desc':
        return b.finalAmount - a.finalAmount
      default:
        return 0
    }
  })
}

// Order timeline
export interface OrderTimelineEvent {
  status: OrderStatus
  timestamp: Date
  description: string
  actor?: 'customer' | 'merchant' | 'rider' | 'system'
}

export function generateOrderTimeline(order: OrderWithItems): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [
    {
      status: 'PENDING_CONFIRMATION',
      timestamp: order.createdAt,
      description: 'Order placed successfully',
      actor: 'customer',
    },
  ]

  // Add events based on order status
  if (order.orderStatus !== 'PENDING_CONFIRMATION') {
    events.push({
      status: 'CONFIRMED',
      timestamp: order.updatedAt, // This would need proper tracking
      description: 'Order confirmed by merchant',
      actor: 'merchant',
    })
  }

  if (['PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)) {
    events.push({
      status: 'PREPARING',
      timestamp: order.updatedAt,
      description: 'Order is being prepared',
      actor: 'merchant',
    })
  }

  if (['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)) {
    events.push({
      status: 'READY_FOR_PICKUP',
      timestamp: order.updatedAt,
      description: 'Order ready for pickup',
      actor: 'merchant',
    })
  }

  if (order.delivery) {
    events.push({
      status: 'OUT_FOR_DELIVERY',
      timestamp: order.delivery.createdAt,
      description: 'Order out for delivery',
      actor: 'rider',
    })
  }

  if (order.orderStatus === 'DELIVERED' && order.deliveredAt) {
    events.push({
      status: 'DELIVERED',
      timestamp: order.deliveredAt,
      description: 'Order delivered successfully',
      actor: 'rider',
    })
  }

  return events
}