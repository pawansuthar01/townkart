import { DeliveryStatus } from '@prisma/client'

export interface Delivery {
  id: string
  orderId: string
  order: any // Order
  riderId: string
  rider: any // RiderProfile
  pickupTime: Date | null
  deliveryTime: Date | null
  pickupOtp: string
  deliveryOtp: string
  deliveryStatus: DeliveryStatus
  proofPhotoUrl: string | null
  distanceKm: number | null
  deliveryFee: number
  createdAt: Date
  updatedAt: Date
}

export interface DeliveryWithOrder extends Delivery {
  order: {
    id: string
    orderNumber: string
    customer: {
      id: string
      fullName: string
      phoneNumber: string
    }
    merchant: {
      id: string
      businessName: string
      address: string
      latitude: number
      longitude: number
    }
    deliveryAddress: any
    finalAmount: number
    specialInstructions: string | null
  }
}

export interface AcceptDeliveryRequest {
  orderId: string
}

export interface UpdateDeliveryStatusRequest {
  status: DeliveryStatus
  pickupOtp?: string
  deliveryOtp?: string
  proofPhotoUrl?: string
}

export interface DeliverySearchFilters {
  riderId?: string
  status?: DeliveryStatus
  dateFrom?: Date
  dateTo?: Date
  minDistance?: number
  maxDistance?: number
  sortBy?: 'newest' | 'oldest' | 'distance' | 'fee'
  page?: number
  limit?: number
}

export interface DeliveryStats {
  totalDeliveries: number
  totalEarnings: number
  averageRating: number
  onTimeDeliveryRate: number
  averageDeliveryTime: number
  deliveriesByStatus: Record<DeliveryStatus, number>
  dailyDeliveries: { date: string; count: number; earnings: number }[]
  monthlyStats: {
    month: string
    deliveries: number
    earnings: number
    rating: number
  }[]
}

export interface DeliveryDashboardData {
  activeDeliveries: DeliveryWithOrder[]
  availableDeliveries: DeliveryWithOrder[]
  completedDeliveries: DeliveryWithOrder[]
  stats: DeliveryStats
  todayEarnings: number
  todayDeliveries: number
  currentLocation: {
    latitude: number
    longitude: number
  } | null
}

// Delivery status helpers
export function getDeliveryStatusColor(status: DeliveryStatus): string {
  switch (status) {
    case 'ASSIGNED':
      return 'text-blue-600 bg-blue-100'
    case 'PICKED_UP':
      return 'text-orange-600 bg-orange-100'
    case 'OUT_FOR_DELIVERY':
      return 'text-purple-600 bg-purple-100'
    case 'DELIVERED':
      return 'text-green-600 bg-green-100'
    case 'CANCELLED':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getDeliveryStatusText(status: DeliveryStatus): string {
  switch (status) {
    case 'ASSIGNED':
      return 'Assigned'
    case 'PICKED_UP':
      return 'Picked Up'
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery'
    case 'DELIVERED':
      return 'Delivered'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return status
  }
}

export function getDeliveryStatusIcon(status: DeliveryStatus): string {
  switch (status) {
    case 'ASSIGNED':
      return '📋'
    case 'PICKED_UP':
      return '📦'
    case 'OUT_FOR_DELIVERY':
      return '🚴'
    case 'DELIVERED':
      return '✅'
    case 'CANCELLED':
      return '❌'
    default:
      return '📦'
  }
}

export function canUpdateDeliveryStatus(currentStatus: DeliveryStatus, newStatus: DeliveryStatus): boolean {
  const statusFlow: Record<DeliveryStatus, DeliveryStatus[]> = {
    ASSIGNED: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['OUT_FOR_DELIVERY', 'CANCELLED'],
    OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [],
    CANCELLED: [],
  }

  return statusFlow[currentStatus]?.includes(newStatus) ?? false
}

// Delivery time calculations
export function calculateEstimatedDeliveryTime(distanceKm: number): number {
  // Base time: 10 minutes
  // Additional time: 3 minutes per km
  const baseTime = 10
  const perKmTime = 3
  return baseTime + Math.ceil(distanceKm) * perKmTime
}

export function formatDeliveryTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export function isDeliveryOnTime(pickupTime: Date, deliveryTime: Date, estimatedMinutes: number): boolean {
  const actualMinutes = (deliveryTime.getTime() - pickupTime.getTime()) / (1000 * 60)
  return actualMinutes <= estimatedMinutes
}

// Delivery earnings calculations
export function calculateDeliveryEarnings(distanceKm: number, isPeakHour: boolean = false): number {
  const baseFee = 20
  const perKmFee = 5
  const peakHourMultiplier = isPeakHour ? 1.5 : 1

  return (baseFee + Math.ceil(distanceKm) * perKmFee) * peakHourMultiplier
}

export function calculateDailyEarnings(deliveries: Delivery[]): number {
  return deliveries.reduce((total, delivery) => total + delivery.deliveryFee, 0)
}

export function calculateWeeklyEarnings(deliveries: Delivery[]): number {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  return deliveries
    .filter(delivery => delivery.createdAt >= weekAgo)
    .reduce((total, delivery) => total + delivery.deliveryFee, 0)
}

// Delivery location helpers
export function calculateDistance(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = ((toLat - fromLat) * Math.PI) / 180
  const dLng = ((toLng - fromLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

export function isWithinDeliveryRadius(
  riderLat: number,
  riderLng: number,
  merchantLat: number,
  merchantLng: number,
  maxRadiusKm: number = 2
): boolean {
  const distance = calculateDistance(riderLat, riderLng, merchantLat, merchantLng)
  return distance <= maxRadiusKm
}

// Delivery validation
export function validateDeliveryUpdate(data: UpdateDeliveryStatusRequest): string[] {
  const errors: string[] = []

  if (!data.status) {
    errors.push('Delivery status is required')
  }

  if (data.status === 'PICKED_UP' && !data.pickupOtp) {
    errors.push('Pickup OTP is required when marking as picked up')
  }

  if (data.status === 'DELIVERED' && !data.deliveryOtp) {
    errors.push('Delivery OTP is required when marking as delivered')
  }

  if (data.status === 'DELIVERED' && !data.proofPhotoUrl) {
    errors.push('Proof photo is required when marking as delivered')
  }

  if (data.pickupOtp && !/^\d{4}$/.test(data.pickupOtp)) {
    errors.push('Pickup OTP must be 4 digits')
  }

  if (data.deliveryOtp && !/^\d{4}$/.test(data.deliveryOtp)) {
    errors.push('Delivery OTP must be 4 digits')
  }

  return errors
}

// Delivery search and filtering
export function matchesDeliveryFilters(delivery: Delivery, filters: DeliverySearchFilters): boolean {
  if (filters.riderId && delivery.riderId !== filters.riderId) return false
  if (filters.status && delivery.deliveryStatus !== filters.status) return false
  if (filters.dateFrom && delivery.createdAt < filters.dateFrom) return false
  if (filters.dateTo && delivery.createdAt > filters.dateTo) return false
  if (filters.minDistance && (!delivery.distanceKm || delivery.distanceKm < filters.minDistance)) return false
  if (filters.maxDistance && (!delivery.distanceKm || delivery.distanceKm > filters.maxDistance)) return false

  return true
}

export function sortDeliveries(deliveries: Delivery[], sortBy: string): Delivery[] {
  return [...deliveries].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'distance':
        return (a.distanceKm || 0) - (b.distanceKm || 0)
      case 'fee':
        return b.deliveryFee - a.deliveryFee
      default:
        return 0
    }
  })
}

// Delivery timeline
export interface DeliveryTimelineEvent {
  status: DeliveryStatus
  timestamp: Date
  description: string
  location?: {
    latitude: number
    longitude: number
  }
}

export function generateDeliveryTimeline(delivery: Delivery): DeliveryTimelineEvent[] {
  const events: DeliveryTimelineEvent[] = [
    {
      status: 'ASSIGNED',
      timestamp: delivery.createdAt,
      description: 'Delivery assigned to rider',
    },
  ]

  if (delivery.deliveryStatus !== 'ASSIGNED' && delivery.pickupTime) {
    events.push({
      status: 'PICKED_UP',
      timestamp: delivery.pickupTime,
      description: 'Order picked up from merchant',
    })
  }

  if (['OUT_FOR_DELIVERY', 'DELIVERED'].includes(delivery.deliveryStatus)) {
    events.push({
      status: 'OUT_FOR_DELIVERY',
      timestamp: delivery.updatedAt,
      description: 'Out for delivery',
    })
  }

  if (delivery.deliveryStatus === 'DELIVERED' && delivery.deliveryTime) {
    events.push({
      status: 'DELIVERED',
      timestamp: delivery.deliveryTime,
      description: 'Order delivered successfully',
    })
  }

  return events
}

// Delivery performance metrics
export interface DeliveryPerformance {
  averageDeliveryTime: number
  onTimeDeliveryRate: number
  customerRating: number
  earnings: number
  deliveriesCompleted: number
  cancellationRate: number
}

export function calculateDeliveryPerformance(deliveries: Delivery[]): DeliveryPerformance {
  const completedDeliveries = deliveries.filter(d => d.deliveryStatus === 'DELIVERED')
  const totalDeliveries = deliveries.length

  const averageDeliveryTime = completedDeliveries.length > 0
    ? completedDeliveries.reduce((sum, d) => {
        if (d.pickupTime && d.deliveryTime) {
          return sum + (d.deliveryTime.getTime() - d.pickupTime.getTime()) / (1000 * 60)
        }
        return sum
      }, 0) / completedDeliveries.length
    : 0

  const onTimeDeliveries = completedDeliveries.filter(d => {
    if (!d.distanceKm || !d.pickupTime || !d.deliveryTime) return false
    const estimatedTime = calculateEstimatedDeliveryTime(d.distanceKm)
    return isDeliveryOnTime(d.pickupTime, d.deliveryTime, estimatedTime)
  }).length

  const onTimeDeliveryRate = completedDeliveries.length > 0
    ? (onTimeDeliveries / completedDeliveries.length) * 100
    : 0

  const earnings = deliveries.reduce((sum, d) => sum + d.deliveryFee, 0)
  const cancellationRate = totalDeliveries > 0
    ? (deliveries.filter(d => d.deliveryStatus === 'CANCELLED').length / totalDeliveries) * 100
    : 0

  return {
    averageDeliveryTime,
    onTimeDeliveryRate,
    customerRating: 0, // Would need to calculate from reviews
    earnings,
    deliveriesCompleted: completedDeliveries.length,
    cancellationRate,
  }
}