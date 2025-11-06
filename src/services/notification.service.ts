import { apiClient } from '@/lib/api-client'

export class NotificationService {
  static async getNotifications(filters?: any): Promise<any> {
    const response = await apiClient.get('/notifications', { params: filters })
    return response.data
  }

  static async getNotificationById(notificationId: string): Promise<any> {
    const response = await apiClient.get(`/notifications/${notificationId}`)
    return response.data
  }

  static async markAsRead(notificationId: string): Promise<any> {
    const response = await apiClient.put(`/notifications/${notificationId}/read`)
    return response.data
  }

  static async markAllAsRead(): Promise<any> {
    const response = await apiClient.put('/notifications/read-all')
    return response.data
  }

  static async deleteNotification(notificationId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/notifications/${notificationId}`)
    return response.data
  }

  static async getUnreadCount(): Promise<any> {
    const response = await apiClient.get('/notifications/unread-count')
    return response.data
  }

  static async sendNotification(notificationData: any): Promise<any> {
    const response = await apiClient.post('/notifications/send', notificationData)
    return response.data
  }

  static async sendBulkNotifications(notificationsData: any[]): Promise<any> {
    const response = await apiClient.post('/notifications/send-bulk', {
      notifications: notificationsData
    })
    return response.data
  }

  static async getNotificationTemplates(): Promise<any[]> {
    const response = await apiClient.get('/notifications/templates')
    return response.data
  }

  static async createNotificationTemplate(templateData: any): Promise<any> {
    const response = await apiClient.post('/notifications/templates', templateData)
    return response.data
  }

  static async updateNotificationTemplate(templateId: string, templateData: any): Promise<any> {
    const response = await apiClient.put(`/notifications/templates/${templateId}`, templateData)
    return response.data
  }

  static async deleteNotificationTemplate(templateId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/notifications/templates/${templateId}`)
    return response.data
  }

  static async sendOrderNotification(orderId: string, type: string): Promise<any> {
    const response = await apiClient.post('/notifications/order', {
      orderId,
      type
    })
    return response.data
  }

  static async sendDeliveryNotification(deliveryId: string, type: string): Promise<any> {
    const response = await apiClient.post('/notifications/delivery', {
      deliveryId,
      type
    })
    return response.data
  }

  static async sendPaymentNotification(paymentId: string, type: string): Promise<any> {
    const response = await apiClient.post('/notifications/payment', {
      paymentId,
      type
    })
    return response.data
  }

  static async getNotificationSettings(): Promise<any> {
    const response = await apiClient.get('/notifications/settings')
    return response.data
  }

  static async updateNotificationSettings(settings: any): Promise<any> {
    const response = await apiClient.put('/notifications/settings', settings)
    return response.data
  }

  static async subscribeToTopic(topic: string): Promise<any> {
    const response = await apiClient.post('/notifications/subscribe', { topic })
    return response.data
  }

  static async unsubscribeFromTopic(topic: string): Promise<any> {
    const response = await apiClient.post('/notifications/unsubscribe', { topic })
    return response.data
  }

  static async getNotificationAnalytics(dateRange?: any): Promise<any> {
    const response = await apiClient.get('/notifications/analytics', { params: dateRange })
    return response.data
  }

  static async sendSMS(phoneNumber: string, message: string): Promise<any> {
    const response = await apiClient.post('/notifications/sms', {
      phoneNumber,
      message
    })
    return response.data
  }

  static async sendEmail(email: string, subject: string, message: string): Promise<any> {
    const response = await apiClient.post('/notifications/email', {
      email,
      subject,
      message
    })
    return response.data
  }

  static async sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<any> {
    const response = await apiClient.post('/notifications/push', {
      userId,
      title,
      body,
      data
    })
    return response.data
  }

  static async getNotificationHistory(userId?: string, page: number = 1, limit: number = 10): Promise<any> {
    const response = await apiClient.get('/notifications/history', {
      params: { userId, page, limit }
    })
    return response.data
  }

  static async archiveNotification(notificationId: string): Promise<any> {
    const response = await apiClient.put(`/notifications/${notificationId}/archive`)
    return response.data
  }

  static async getArchivedNotifications(page: number = 1, limit: number = 10): Promise<any> {
    const response = await apiClient.get('/notifications/archived', {
      params: { page, limit }
    })
    return response.data
  }
}