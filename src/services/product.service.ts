import { apiClient } from '@/lib/api-client'
import { ProductSearchFilters } from '@/types/product.types'

export class ProductService {
  static async getProducts(filters?: ProductSearchFilters): Promise<any> {
    const response = await apiClient.get('/products', { params: filters })
    return response.data
  }

  static async getProductById(productId: string): Promise<any> {
    const response = await apiClient.get(`/products/${productId}`)
    return response.data
  }

  static async createProduct(productData: any): Promise<any> {
    const response = await apiClient.post('/products', productData)
    return response.data
  }

  static async updateProduct(productId: string, productData: any): Promise<any> {
    const response = await apiClient.put(`/products/${productId}`, productData)
    return response.data
  }

  static async deleteProduct(productId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/products/${productId}`)
    return response.data
  }

  static async searchProducts(query: string, filters?: any): Promise<any[]> {
    const response = await apiClient.get('/products/search', {
      params: { query, ...filters }
    })
    return response.data
  }

  static async getProductsByCategory(category: string, filters?: any): Promise<any[]> {
    const response = await apiClient.get('/products/category', {
      params: { category, ...filters }
    })
    return response.data
  }

  static async getProductsByShop(shopId: string, filters?: any): Promise<any[]> {
    const response = await apiClient.get(`/shops/${shopId}/products`, { params: filters })
    return response.data
  }

  static async getFeaturedProducts(limit: number = 10): Promise<any[]> {
    const response = await apiClient.get('/products/featured', { params: { limit } })
    return response.data
  }

  static async getPopularProducts(limit: number = 10): Promise<any[]> {
    const response = await apiClient.get('/products/popular', { params: { limit } })
    return response.data
  }

  static async getNewProducts(limit: number = 10): Promise<any[]> {
    const response = await apiClient.get('/products/new', { params: { limit } })
    return response.data
  }

  static async getProductCategories(): Promise<string[]> {
    const response = await apiClient.get('/products/categories')
    return response.data
  }

  static async updateProductStock(productId: string, stockQuantity: number): Promise<any> {
    const response = await apiClient.patch(`/products/${productId}/stock`, { stockQuantity })
    return response.data
  }

  static async updateProductPrice(productId: string, price: number, discountedPrice?: number): Promise<any> {
    const response = await apiClient.patch(`/products/${productId}/price`, {
      price,
      discountedPrice
    })
    return response.data
  }

  static async uploadProductImage(productId: string, imageFile: File): Promise<any> {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('type', 'product')

    const response = await apiClient.post(`/products/${productId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  static async getProductReviews(productId: string, page: number = 1, limit: number = 10): Promise<any> {
    const response = await apiClient.get(`/products/${productId}/reviews`, {
      params: { page, limit }
    })
    return response.data
  }

  static async getProductStats(productId: string): Promise<any> {
    const response = await apiClient.get(`/products/${productId}/stats`)
    return response.data
  }

  static async toggleProductAvailability(productId: string, isAvailable: boolean): Promise<any> {
    const response = await apiClient.patch(`/products/${productId}/availability`, { isAvailable })
    return response.data
  }

  static async bulkUpdateProducts(productsData: any[]): Promise<any> {
    const response = await apiClient.post('/products/bulk-update', { products: productsData })
    return response.data
  }

  static async getLowStockProducts(threshold: number = 10): Promise<any[]> {
    const response = await apiClient.get('/products/low-stock', { params: { threshold } })
    return response.data
  }

  static async getOutOfStockProducts(): Promise<any[]> {
    const response = await apiClient.get('/products/out-of-stock')
    return response.data
  }
}