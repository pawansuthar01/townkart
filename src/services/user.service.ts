import { apiClient } from '@/lib/api-client'

export class UserService {
  static async getProfile(): Promise<any> {
    const response = await apiClient.get('/users/profile')
    return response.data
  }

  static async updateProfile(profileData: any): Promise<any> {
    const response = await apiClient.put('/users/profile', profileData)
    return response.data
  }

  static async getAddresses(): Promise<any[]> {
    const response = await apiClient.get('/users/addresses')
    return response.data
  }

  static async addAddress(addressData: any): Promise<any> {
    const response = await apiClient.post('/users/addresses', addressData)
    return response.data
  }

  static async updateAddress(addressId: string, addressData: any): Promise<any> {
    const response = await apiClient.put(`/users/addresses/${addressId}`, addressData)
    return response.data
  }

  static async deleteAddress(addressId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/users/addresses/${addressId}`)
    return response.data
  }

  static async switchRole(role: string): Promise<any> {
    const response = await apiClient.post('/users/switch-role', { role })
    return response.data
  }

  static async getUserStats(): Promise<any> {
    const response = await apiClient.get('/users/stats')
    return response.data
  }

  static async updatePreferences(preferences: any): Promise<any> {
    const response = await apiClient.put('/users/preferences', preferences)
    return response.data
  }

  static async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/users/change-password', passwordData)
    return response.data
  }

  static async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete('/users/account')
    return response.data
  }
}