import { apiClient } from '@/lib/api-client'

export class OrderService {
  static async createOrder(orderData: any): Promise<any> {
    const response = await apiClient.post('/orders', orderData)
    return response.data
  }

  static async getOrders(filters?: any): Promise<any> {
    const response = await apiClient.get('/orders', { params: filters })
    return response.data
  }

  static async getOrderById(orderId: string): Promise<any> {
    const response = await apiClient.get(`/orders/${orderId}`)
    return response.data
  }

  static async updateOrderStatus(orderId: string, status: string, additionalData?: any): Promise<any> {
    const response = await apiClient.put(`/orders/${orderId}/status`, {
      status,
      ...additionalData
    })
    return response.data
  }

  static async cancelOrder(orderId: string, reason?: string): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, { reason })
    return response.data
  }

  static async getOrderHistory(page: number = 1, limit: number = 10): Promise<any> {
    const response = await apiClient.get('/orders/history', {
      params: { page, limit }
    })
    return response.data
  }

  static async getActiveOrders(): Promise<any[]> {
    const response = await apiClient.get('/orders/active')
    return response.data
  }

  static async getOrderTracking(orderId: string): Promise<any> {
    const response = await apiClient.get(`/orders/${orderId}/tracking`)
    return response.data
  }

  static async reorder(orderId: string): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/reorder`)
    return response.data
  }

  static async getOrderStats(): Promise<any> {
    const response = await apiClient.get('/orders/stats')
    return response.data
  }

  static async getMerchantOrders(merchantId: string, filters?: any): Promise<any> {
    const response = await apiClient.get(`/merchants/${merchantId}/orders`, { params: filters })
    return response.data
  }

  static async acceptOrder(orderId: string): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/accept`)
    return response.data
  }

  static async rejectOrder(orderId: string, reason: string): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/reject`, { reason })
    return response.data
  }

  static async markOrderReady(orderId: string): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/ready`)
    return response.data
  }

  static async getOrderItems(orderId: string): Promise<any[]> {
    const response = await apiClient.get(`/orders/${orderId}/items`)
    return response.data
  }

  static async updateOrderItem(orderId: string, itemId: string, updates: any): Promise<any> {
    const response = await apiClient.put(`/orders/${orderId}/items/${itemId}`, updates)
    return response.data
  }

  static async addOrderNote(orderId: string, note: string): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/notes`, { note })
    return response.data
  }

  static async getOrderNotes(orderId: string): Promise<any[]> {
    const response = await apiClient.get(`/orders/${orderId}/notes`)
    return response.data
  }

  static async calculateDeliveryFee(distance: number, orderValue: number): Promise<any> {
    const response = await apiClient.post('/orders/calculate-delivery-fee', {
      distance,
      orderValue
    })
    return response.data
  }

  static async applyCoupon(orderId: string, couponCode: string): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/apply-coupon`, { couponCode })
    return response.data
  }

  static async removeCoupon(orderId: string): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/remove-coupon`)
    return response.data
  }

  static async getOrderInvoice(orderId: string): Promise<any> {
    const response = await apiClient.get(`/orders/${orderId}/invoice`)
    return response.data
  }

  static async requestRefund(orderId: string, reason: string, amount?: number): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/refund`, {
      reason,
      amount
    })
    return response.data
  }
}