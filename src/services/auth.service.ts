import { apiClient } from '@/lib/api-client'
import { LoginRequest, RegisterRequest, VerifyOtpRequest, AuthResponse, RefreshTokenRequest } from '@/types/user.types'

export class AuthService {
  static async login(credentials: LoginRequest): Promise<{ otpSent: boolean; message: string }> {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  }

  static async register(userData: RegisterRequest): Promise<{ otpSent: boolean; message: string }> {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  }

  static async verifyOtp(otpData: VerifyOtpRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/verify-otp', otpData)
    return response.data
  }

  static async refreshToken(refreshData: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/refresh-token', refreshData)
    return response.data
  }

  static async logout(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/auth/logout')
    return response.data
  }

  static async getProfile(): Promise<any> {
    const response = await apiClient.get('/users/profile')
    return response.data
  }

  static async updateProfile(profileData: any): Promise<any> {
    const response = await apiClient.put('/users/profile', profileData)
    return response.data
  }

  static async switchRole(role: string): Promise<any> {
    const response = await apiClient.post('/users/switch-role', { role })
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
}