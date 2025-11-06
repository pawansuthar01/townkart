'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FileX, ShoppingBag, Truck, Store } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'secondary'
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="mb-4 text-gray-400">
        {icon || <FileX className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Predefined empty states for common scenarios
export function EmptyOrders() {
  return (
    <EmptyState
      icon={<ShoppingBag className="h-12 w-12" />}
      title="No orders yet"
      description="You haven't placed any orders yet. Start shopping to see your order history here."
      action={{
        label: 'Start Shopping',
        onClick: () => window.location.href = '/shops',
      }}
    />
  )
}

export function EmptyProducts() {
  return (
    <EmptyState
      icon={<Store className="h-12 w-12" />}
      title="No products found"
      description="We couldn't find any products matching your search criteria."
    />
  )
}

export function EmptyDeliveries() {
  return (
    <EmptyState
      icon={<Truck className="h-12 w-12" />}
      title="No deliveries available"
      description="There are no delivery tasks available in your area right now."
    />
  )
}

export function EmptyShops() {
  return (
    <EmptyState
      icon={<Store className="h-12 w-12" />}
      title="No shops found"
      description="We couldn't find any shops in your area. Try adjusting your search or location."
    />
  )
}

export function EmptyNotifications() {
  return (
    <EmptyState
      title="No notifications"
      description="You're all caught up! New notifications will appear here."
    />
  )
}

export function EmptyCart() {
  return (
    <EmptyState
      icon={<ShoppingBag className="h-12 w-12" />}
      title="Your cart is empty"
      description="Add some delicious items from your favorite shops to get started."
      action={{
        label: 'Browse Shops',
        onClick: () => window.location.href = '/shops',
      }}
    />
  )
}