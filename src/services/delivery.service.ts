import { apiClient } from '@/lib/api-client'

export class DeliveryService {
  static async getAvailableDeliveries(filters?: any): Promise<any[]> {
    const response = await apiClient.get('/deliveries/available', { params: filters })
    return response.data
  }

  static async acceptDelivery(orderId: string): Promise<any> {
    const response = await apiClient.post('/deliveries/accept', { orderId })
    return response.data
  }

  static async getMyDeliveries(filters?: any): Promise<any> {
    const response = await apiClient.get('/deliveries/my-deliveries', { params: filters })
    return response.data
  }

  static async getDeliveryById(deliveryId: string): Promise<any> {
    const response = await apiClient.get(`/deliveries/${deliveryId}`)
    return response.data
  }

  static async updateDeliveryStatus(deliveryId: string, status: string, additionalData?: any): Promise<any> {
    const response = await apiClient.put(`/deliveries/${deliveryId}/status`, {
      status,
      ...additionalData
    })
    return response.data
  }

  static async startPickup(deliveryId: string, otp: string): Promise<any> {
    const response = await apiClient.post(`/deliveries/${deliveryId}/pickup`, { otp })
    return response.data
  }

  static async completePickup(deliveryId: string): Promise<any> {
    const response = await apiClient.post(`/deliveries/${deliveryId}/pickup-complete`)
    return response.data
  }

  static async startDelivery(deliveryId: string): Promise<any> {
    const response = await apiClient.post(`/deliveries/${deliveryId}/start-delivery`)
    return response.data
  }

  static async completeDelivery(deliveryId: string, otp: string, proofPhoto?: File): Promise<any> {
    const formData = new FormData()
    formData.append('otp', otp)
    if (proofPhoto) {
      formData.append('proofPhoto', proofPhoto)
    }

    const response = await apiClient.post(`/deliveries/${deliveryId}/complete`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async updateLocation(deliveryId: string, latitude: number, longitude: number): Promise<any> {
    const response = await apiClient.post(`/deliveries/${deliveryId}/location`, {
      latitude,
      longitude
    })
    return response.data
  }

  static async getDeliveryRoute(deliveryId: string): Promise<any> {
    const response = await apiClient.get(`/deliveries/${deliveryId}/route`)
    return response.data
  }

  static async getDeliveryStats(): Promise<any> {
    const response = await apiClient.get('/deliveries/stats')
    return response.data
  }

  static async getEarnings(filters?: any): Promise<any> {
    const response = await apiClient.get('/deliveries/earnings', { params: filters })
    return response.data
  }

  static async withdrawEarnings(amount: number): Promise<any> {
    const response = await apiClient.post('/deliveries/withdraw', { amount })
    return response.data
  }

  static async getDeliveryHistory(page: number = 1, limit: number = 10): Promise<any> {
    const response = await apiClient.get('/deliveries/history', {
      params: { page, limit }
    })
    return response.data
  }

  static async reportIssue(deliveryId: string, issueType: string, description: string): Promise<any> {
    const response = await apiClient.post(`/deliveries/${deliveryId}/report-issue`, {
      issueType,
      description
    })
    return response.data
  }

  static async getNearbyDeliveries(latitude: number, longitude: number, radius: number = 5): Promise<any[]> {
    const response = await apiClient.get('/deliveries/nearby', {
      params: { latitude, longitude, radius }
    })
    return response.data
  }

  static async updateAvailability(isAvailable: boolean): Promise<any> {
    const response = await apiClient.post('/deliveries/availability', { isAvailable })
    return response.data
  }

  static async getPerformanceMetrics(): Promise<any> {
    const response = await apiClient.get('/deliveries/performance')
    return response.data
  }

  static async getDeliveryRating(deliveryId: string): Promise<any> {
    const response = await apiClient.get(`/deliveries/${deliveryId}/rating`)
    return response.data
  }

  static async getCustomerInfo(deliveryId: string): Promise<any> {
    const response = await apiClient.get(`/deliveries/${deliveryId}/customer`)
    return response.data
  }

  static async callCustomer(deliveryId: string): Promise<any> {
    const response = await apiClient.post(`/deliveries/${deliveryId}/call-customer`)
    return response.data
  }

  static async sendMessage(deliveryId: string, message: string): Promise<any> {
    const response = await apiClient.post(`/deliveries/${deliveryId}/message`, { message })
    return response.data
  }
}