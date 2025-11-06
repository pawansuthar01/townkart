import { apiClient } from '@/lib/api-client'
import { ShopSearchFilters } from '@/types/shop.types'

export class ShopService {
  static async getShops(filters?: ShopSearchFilters): Promise<any> {
    const response = await apiClient.get('/shops', { params: filters })
    return response.data
  }

  static async getShopById(shopId: string): Promise<any> {
    const response = await apiClient.get(`/shops/${shopId}`)
    return response.data
  }

  static async getShopProducts(shopId: string, filters?: any): Promise<any> {
    const response = await apiClient.get(`/shops/${shopId}/products`, { params: filters })
    return response.data
  }

  static async createShop(shopData: any): Promise<any> {
    const response = await apiClient.post('/shops', shopData)
    return response.data
  }

  static async updateShop(shopId: string, shopData: any): Promise<any> {
    const response = await apiClient.put(`/shops/${shopId}`, shopData)
    return response.data
  }

  static async deleteShop(shopId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/shops/${shopId}`)
    return response.data
  }

  static async getNearbyShops(latitude: number, longitude: number, radius: number = 10): Promise<any[]> {
    const response = await apiClient.get('/shops/nearby', {
      params: { latitude, longitude, radius }
    })
    return response.data
  }

  static async searchShops(query: string, filters?: any): Promise<any[]> {
    const response = await apiClient.get('/shops/search', {
      params: { query, ...filters }
    })
    return response.data
  }

  static async getShopCategories(): Promise<string[]> {
    const response = await apiClient.get('/shops/categories')
    return response.data
  }

  static async getShopStats(shopId: string): Promise<any> {
    const response = await apiClient.get(`/shops/${shopId}/stats`)
    return response.data
  }

  static async updateShopStatus(shopId: string, isActive: boolean): Promise<any> {
    const response = await apiClient.patch(`/shops/${shopId}/status`, { isActive })
    return response.data
  }

  static async uploadShopImage(shopId: string, imageFile: File): Promise<any> {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('type', 'shop')

    const response = await apiClient.post(`/shops/${shopId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async getShopReviews(shopId: string, page: number = 1, limit: number = 10): Promise<any> {
    const response = await apiClient.get(`/shops/${shopId}/reviews`, {
      params: { page, limit }
    })
    return response.data
  }

  static async getTopRatedShops(limit: number = 10): Promise<any[]> {
    const response = await apiClient.get('/shops/top-rated', { params: { limit } })
    return response.data
  }

  static async getFeaturedShops(): Promise<any[]> {
    const response = await apiClient.get('/shops/featured')
    return response.data
  }
}