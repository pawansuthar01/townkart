'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { OrderStatus, PaymentStatus, DeliveryStatus } from '@prisma/client'

interface StatusBadgeProps {
  status: OrderStatus | PaymentStatus | DeliveryStatus | string
  type: 'order' | 'payment' | 'delivery'
  className?: string
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (type) {
      case 'order':
        return getOrderStatusConfig(status as OrderStatus)
      case 'payment':
        return getPaymentStatusConfig(status as PaymentStatus)
      case 'delivery':
        return getDeliveryStatusConfig(status as DeliveryStatus)
      default:
        return { label: status, variant: 'secondary' as const }
    }
  }

  const { label, variant } = getStatusConfig()

  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      {label}
    </Badge>
  )
}

function getOrderStatusConfig(status: OrderStatus) {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return { label: 'Pending Confirmation', variant: 'secondary' as const }
    case 'CONFIRMED':
      return { label: 'Confirmed', variant: 'default' as const }
    case 'PREPARING':
      return { label: 'Preparing', variant: 'warning' as const }
    case 'READY_FOR_PICKUP':
      return { label: 'Ready for Pickup', variant: 'info' as const }
    case 'OUT_FOR_DELIVERY':
      return { label: 'Out for Delivery', variant: 'info' as const }
    case 'DELIVERED':
      return { label: 'Delivered', variant: 'success' as const }
    case 'CANCELLED':
      return { label: 'Cancelled', variant: 'destructive' as const }
    case 'REFUNDED':
      return { label: 'Refunded', variant: 'secondary' as const }
    default:
      return { label: status, variant: 'secondary' as const }
  }
}

function getPaymentStatusConfig(status: PaymentStatus) {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', variant: 'secondary' as const }
    case 'COMPLETED':
      return { label: 'Completed', variant: 'success' as const }
    case 'FAILED':
      return { label: 'Failed', variant: 'destructive' as const }
    case 'REFUNDED':
      return { label: 'Refunded', variant: 'warning' as const }
    default:
      return { label: status, variant: 'secondary' as const }
  }
}

function getDeliveryStatusConfig(status: DeliveryStatus) {
  switch (status) {
    case 'ASSIGNED':
      return { label: 'Assigned', variant: 'default' as const }
    case 'PICKED_UP':
      return { label: 'Picked Up', variant: 'info' as const }
    case 'OUT_FOR_DELIVERY':
      return { label: 'Out for Delivery', variant: 'info' as const }
    case 'DELIVERED':
      return { label: 'Delivered', variant: 'success' as const }
    case 'CANCELLED':
      return { label: 'Cancelled', variant: 'destructive' as const }
    default:
      return { label: status, variant: 'secondary' as const }
  }
}

// Specialized status badges for different contexts
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return <StatusBadge status={status} type="order" className={className} />
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return <StatusBadge status={status} type="payment" className={className} />
}

export function DeliveryStatusBadge({ status, className }: { status: DeliveryStatus; className?: string }) {
  return <StatusBadge status={status} type="delivery" className={className} />
}

// Generic status badge for any status
export function GenericStatusBadge({
  status,
  variant = 'secondary',
  className
}: {
  status: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
  className?: string
}) {
  return (
    <Badge variant={variant} className={cn('capitalize', className)}>
      {status.replace(/_/g, ' ').toLowerCase()}
    </Badge>
  )
}