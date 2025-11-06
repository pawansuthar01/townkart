import { apiClient } from '@/lib/api-client'

export class PaymentService {
  static async initiatePayment(orderId: string, paymentData: any): Promise<any> {
    const response = await apiClient.post('/payments/initiate', {
      orderId,
      ...paymentData
    })
    return response.data
  }

  static async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<any> {
    const response = await apiClient.post('/payments/verify', {
      orderId,
      paymentId,
      signature
    })
    return response.data
  }

  static async getPaymentHistory(filters?: any): Promise<any> {
    const response = await apiClient.get('/payments/history', { params: filters })
    return response.data
  }

  static async getPaymentById(paymentId: string): Promise<any> {
    const response = await apiClient.get(`/payments/${paymentId}`)
    return response.data
  }

  static async processRefund(orderId: string, amount: number, reason: string): Promise<any> {
    const response = await apiClient.post('/payments/refund', {
      orderId,
      amount,
      reason
    })
    return response.data
  }

  static async getPaymentMethods(): Promise<any[]> {
    const response = await apiClient.get('/payments/methods')
    return response.data
  }

  static async savePaymentMethod(paymentMethodData: any): Promise<any> {
    const response = await apiClient.post('/payments/save-method', paymentMethodData)
    return response.data
  }

  static async deletePaymentMethod(methodId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/payments/methods/${methodId}`)
    return response.data
  }

  static async getWalletBalance(): Promise<any> {
    const response = await apiClient.get('/payments/wallet/balance')
    return response.data
  }

  static async addMoneyToWallet(amount: number, paymentMethod: string): Promise<any> {
    const response = await apiClient.post('/payments/wallet/add-money', {
      amount,
      paymentMethod
    })
    return response.data
  }

  static async withdrawFromWallet(amount: number): Promise<any> {
    const response = await apiClient.post('/payments/wallet/withdraw', { amount })
    return response.data
  }

  static async getWalletTransactions(page: number = 1, limit: number = 10): Promise<any> {
    const response = await apiClient.get('/payments/wallet/transactions', {
      params: { page, limit }
    })
    return response.data
  }

  static async getMerchantWallet(merchantId: string): Promise<any> {
    const response = await apiClient.get(`/payments/merchants/${merchantId}/wallet`)
    return response.data
  }

  static async getRiderWallet(riderId: string): Promise<any> {
    const response = await apiClient.get(`/payments/riders/${riderId}/wallet`)
    return response.data
  }

  static async processMerchantPayout(merchantId: string, amount: number): Promise<any> {
    const response = await apiClient.post(`/payments/merchants/${merchantId}/payout`, { amount })
    return response.data
  }

  static async processRiderPayout(riderId: string, amount: number): Promise<any> {
    const response = await apiClient.post(`/payments/riders/${riderId}/payout`, { amount })
    return response.data
  }

  static async getPaymentStats(): Promise<any> {
    const response = await apiClient.get('/payments/stats')
    return response.data
  }

  static async getFailedPayments(): Promise<any[]> {
    const response = await apiClient.get('/payments/failed')
    return response.data
  }

  static async retryPayment(paymentId: string): Promise<any> {
    const response = await apiClient.post(`/payments/${paymentId}/retry`)
    return response.data
  }

  static async getPaymentInvoice(paymentId: string): Promise<any> {
    const response = await apiClient.get(`/payments/${paymentId}/invoice`)
    return response.data
  }

  static async validateCoupon(code: string, orderValue: number): Promise<any> {
    const response = await apiClient.post('/payments/validate-coupon', {
      code,
      orderValue
    })
    return response.data
  }

  static async applyDiscount(orderId: string, discountCode: string): Promise<any> {
    const response = await apiClient.post(`/payments/${orderId}/apply-discount`, {
      discountCode
    })
    return response.data
  }

  static async removeDiscount(orderId: string): Promise<any> {
    const response = await apiClient.post(`/payments/${orderId}/remove-discount`)
    return response.data
  }

  static async getPaymentAnalytics(dateRange?: any): Promise<any> {
    const response = await apiClient.get('/payments/analytics', { params: dateRange })
    return response.data
  }

  static async processBulkPayments(paymentData: any[]): Promise<any> {
    const response = await apiClient.post('/payments/bulk-process', { payments: paymentData })
    return response.data
  }
}