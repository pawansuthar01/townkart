import { PaymentStatus, PaymentMethod } from '@prisma/client'

export interface Payment {
  id: string
  orderId: string
  order: any // Order
  amount: number
  paymentMethod: PaymentMethod
  transactionId: string | null
  paymentStatus: PaymentStatus
  gatewayOrderId: string | null
  gatewayPaymentId: string | null
  gatewaySignature: string | null
  createdAt: Date
  completedAt: Date | null
}

export interface InitiatePaymentRequest {
  orderId: string
  paymentMethod: PaymentMethod
}

export interface VerifyPaymentRequest {
  orderId: string
  paymentId: string
  signature: string
}

export interface PaymentResponse {
  success: boolean
  paymentId?: string
  orderId?: string
  amount?: number
  currency?: string
  status?: PaymentStatus
  gatewayResponse?: any
}

export interface RazorpayOrderResponse {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string | null
  offer_id: string | null
  status: string
  attempts: number
  notes: any[]
  created_at: number
}

export interface RazorpayPaymentResponse {
  id: string
  entity: string
  amount: number
  currency: string
  status: string
  order_id: string | null
  invoice_id: string | null
  international: boolean
  method: string
  amount_refunded: number
  refund_status: string | null
  captured: boolean
  description: string | null
  card_id: string | null
  bank: string | null
  wallet: string | null
  vpa: string | null
  email: string
  contact: string
  notes: any[]
  fee: number | null
  tax: number | null
  error_code: string | null
  error_description: string | null
  created_at: number
}

export interface PaymentStats {
  totalPayments: number
  totalAmount: number
  successfulPayments: number
  failedPayments: number
  refundedPayments: number
  paymentsByMethod: Record<PaymentMethod, number>
  dailyPayments: { date: string; amount: number; count: number }[]
  monthlyRevenue: number
}

export interface PaymentDashboardData {
  recentPayments: Payment[]
  stats: PaymentStats
  pendingPayments: Payment[]
  failedPayments: Payment[]
  todayRevenue: number
  todayPayments: number
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

export function getPaymentStatusIcon(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return '⏳'
    case 'COMPLETED':
      return '✅'
    case 'FAILED':
      return '❌'
    case 'REFUNDED':
      return '💰'
    default:
      return '💳'
  }
}

export function getPaymentMethodText(method: PaymentMethod): string {
  switch (method) {
    case 'CASH_ON_DELIVERY':
      return 'Cash on Delivery'
    case 'UPI':
      return 'UPI'
    case 'CARD':
      return 'Card'
    case 'WALLET':
      return 'Digital Wallet'
    case 'NET_BANKING':
      return 'Net Banking'
    default:
      return method
  }
}

export function getPaymentMethodIcon(method: PaymentMethod): string {
  switch (method) {
    case 'CASH_ON_DELIVERY':
      return '💵'
    case 'UPI':
      return '📱'
    case 'CARD':
      return '💳'
    case 'WALLET':
      return '👛'
    case 'NET_BANKING':
      return '🏦'
    default:
      return '💰'
  }
}

// Payment validation
export function validatePaymentAmount(amount: number): boolean {
  return amount > 0 && amount <= 50000 // Max ₹50,000 per transaction
}

export function validatePaymentMethod(method: PaymentMethod): boolean {
  return Object.values(PaymentMethod).includes(method)
}

export function validateRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto')
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return signature === expectedSignature
}

// Payment calculation helpers
export function calculatePlatformFee(amount: number, rate: number = 0.02): number {
  return Math.round(amount * rate * 100) / 100
}

export function calculateGST(amount: number, rate: number = 0.18): number {
  return Math.round(amount * rate * 100) / 100
}

export function calculateMerchantSettlement(amount: number, platformFee: number, gst: number): number {
  return amount - platformFee - gst
}

// Razorpay integration helpers
export function createRazorpayOrderData(
  amount: number,
  currency: string = 'INR',
  receipt?: string
) {
  return {
    amount: Math.round(amount * 100), // Convert to paisa
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
    payment_capture: 1,
  }
}

export function formatRazorpayAmount(amount: number): number {
  return Math.round(amount * 100) // Convert to paisa
}

export function parseRazorpayAmount(amount: number): number {
  return amount / 100 // Convert from paisa to rupees
}

// Payment search and filtering
export interface PaymentSearchFilters {
  orderId?: string
  paymentMethod?: PaymentMethod
  status?: PaymentStatus
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
  sortBy?: 'newest' | 'oldest' | 'amount_asc' | 'amount_desc'
  page?: number
  limit?: number
}

export function matchesPaymentFilters(payment: Payment, filters: PaymentSearchFilters): boolean {
  if (filters.orderId && payment.orderId !== filters.orderId) return false
  if (filters.paymentMethod && payment.paymentMethod !== filters.paymentMethod) return false
  if (filters.status && payment.paymentStatus !== filters.status) return false
  if (filters.dateFrom && payment.createdAt < filters.dateFrom) return false
  if (filters.dateTo && payment.createdAt > filters.dateTo) return false
  if (filters.minAmount && payment.amount < filters.minAmount) return false
  if (filters.maxAmount && payment.amount > filters.maxAmount) return false

  return true
}

export function sortPayments(payments: Payment[], sortBy: string): Payment[] {
  return [...payments].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'amount_asc':
        return a.amount - b.amount
      case 'amount_desc':
        return b.amount - a.amount
      default:
        return 0
    }
  })
}

// Payment analytics
export interface PaymentAnalytics {
  totalRevenue: number
  totalTransactions: number
  averageTransactionValue: number
  successRate: number
  refundRate: number
  popularPaymentMethods: { method: PaymentMethod; count: number; percentage: number }[]
  revenueByMethod: Record<PaymentMethod, number>
  dailyRevenue: { date: string; amount: number; transactions: number }[]
  monthlyTrends: { month: string; revenue: number; transactions: number; growth: number }[]
}

export function calculatePaymentAnalytics(payments: Payment[]): PaymentAnalytics {
  const totalRevenue = payments
    .filter(p => p.paymentStatus === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)

  const totalTransactions = payments.length
  const successfulTransactions = payments.filter(p => p.paymentStatus === 'COMPLETED').length
  const refundedTransactions = payments.filter(p => p.paymentStatus === 'REFUNDED').length

  const averageTransactionValue = totalTransactions > 0 ? totalRevenue / successfulTransactions : 0
  const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0
  const refundRate = totalTransactions > 0 ? (refundedTransactions / totalTransactions) * 100 : 0

  // Calculate payment method popularity
  const methodCounts: Record<PaymentMethod, number> = {} as Record<PaymentMethod, number>
  payments.forEach(payment => {
    methodCounts[payment.paymentMethod] = (methodCounts[payment.paymentMethod] || 0) + 1
  })

  const popularPaymentMethods = Object.entries(methodCounts)
    .map(([method, count]) => ({
      method: method as PaymentMethod,
      count,
      percentage: totalTransactions > 0 ? (count / totalTransactions) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // Calculate revenue by method
  const revenueByMethod: Record<PaymentMethod, number> = {} as Record<PaymentMethod, number>
  payments
    .filter(p => p.paymentStatus === 'COMPLETED')
    .forEach(payment => {
      revenueByMethod[payment.paymentMethod] =
        (revenueByMethod[payment.paymentMethod] || 0) + payment.amount
    })

  // Calculate daily revenue (simplified - would need proper date grouping)
  const dailyRevenue: { date: string; amount: number; transactions: number }[] = []

  return {
    totalRevenue,
    totalTransactions,
    averageTransactionValue,
    successRate,
    refundRate,
    popularPaymentMethods,
    revenueByMethod,
    dailyRevenue,
    monthlyTrends: [], // Would need to implement monthly calculation
  }
}

// Webhook handling
export interface RazorpayWebhookPayload {
  event: string
  data: {
    payment?: RazorpayPaymentResponse
    order?: RazorpayOrderResponse
  }
  created_at: number
}

export function handleRazorpayWebhook(payload: RazorpayWebhookPayload): {
  eventType: string
  paymentId?: string
  orderId?: string
  status?: string
} {
  const { event, data } = payload

  switch (event) {
    case 'payment.captured':
      return {
        eventType: 'PAYMENT_CAPTURED',
        paymentId: data.payment?.id,
        orderId: data.payment?.order_id || undefined,
        status: 'COMPLETED',
      }
    case 'payment.failed':
      return {
        eventType: 'PAYMENT_FAILED',
        paymentId: data.payment?.id,
        orderId: data.payment?.order_id || undefined,
        status: 'FAILED',
      }
    case 'order.paid':
      return {
        eventType: 'ORDER_PAID',
        orderId: data.order?.id,
        status: 'COMPLETED',
      }
    default:
      return {
        eventType: event,
      }
  }
}