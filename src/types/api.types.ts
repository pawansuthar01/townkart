// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Auth API types
export interface LoginRequest {
  phoneNumber: string
}

export interface RegisterRequest {
  phoneNumber: string
  fullName: string
  email?: string
}

export interface VerifyOtpRequest {
  phoneNumber: string
  otp: string
}

export interface AuthResponse {
  user: {
    id: string
    phoneNumber: string
    fullName: string | null
    email: string | null
    userRoles: string[]
    activeRole: string
    profileImageUrl: string | null
  }
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

// User API types
export interface UpdateProfileRequest {
  fullName?: string
  email?: string
}

export interface CreateAddressRequest {
  line1: string
  line2?: string
  landmark?: string
  city: string
  state: string
  pincode: string
  latitude?: number
  longitude?: number
  addressType?: 'HOME' | 'WORK' | 'OTHER'
  isDefault?: boolean
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {
  id: string
}

// Merchant API types
export interface CreateMerchantRequest {
  businessName: string
  description?: string
  address: string
  latitude: number
  longitude: number
  category: string
  subcategory?: string
  openingHours?: string
  closingHours?: string
}

export interface UpdateMerchantRequest extends Partial<CreateMerchantRequest> {
  id: string
  isActive?: boolean
}

export interface MerchantSearchRequest {
  query?: string
  category?: string
  latitude?: number
  longitude?: number
  radius?: number
  sortBy?: 'distance' | 'rating' | 'newest' | 'popularity'
  page?: number
  limit?: number
}

// Product API types
export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  discountedPrice?: number
  stockQuantity: number
  category: string
  subcategory?: string
  images?: string[]
  isAvailable?: boolean
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string
}

export interface ProductSearchRequest {
  query?: string
  category?: string
  subcategory?: string
  merchantId?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity'
  page?: number
  limit?: number
}

// Order API types
export interface CreateOrderRequest {
  merchantId: string
  items: {
    productId: string
    quantity: number
  }[]
  deliveryAddress: {
    line1: string
    line2?: string
    landmark?: string
    city: string
    state: string
    pincode: string
    latitude?: number
    longitude?: number
  }
  paymentMethod: string
  specialInstructions?: string
}

export interface UpdateOrderStatusRequest {
  status: string
}

export interface OrderSearchRequest {
  customerId?: string
  merchantId?: string
  riderId?: string
  status?: string
  paymentStatus?: string
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  sortBy?: 'newest' | 'oldest' | 'amount_asc' | 'amount_desc'
  page?: number
  limit?: number
}

// Delivery API types
export interface AcceptDeliveryRequest {
  orderId: string
}

export interface UpdateDeliveryStatusRequest {
  status: string
  pickupOtp?: string
  deliveryOtp?: string
  proofPhotoUrl?: string
}

export interface DeliverySearchRequest {
  riderId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  minDistance?: number
  maxDistance?: number
  sortBy?: 'newest' | 'oldest' | 'distance' | 'fee'
  page?: number
  limit?: number
}

// Payment API types
export interface InitiatePaymentRequest {
  orderId: string
  paymentMethod: string
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
  status?: string
  gatewayResponse?: any
}

// Review API types
export interface CreateReviewRequest {
  orderId: string
  merchantRating?: number
  riderRating?: number
  comment?: string
}

// Notification API types
export interface CreateNotificationRequest {
  userId: string
  title: string
  message: string
  notificationType: string
  referenceId?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface NotificationSearchRequest {
  isRead?: boolean
  type?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

// Upload API types
export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
}

// WebSocket event types
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

export interface OrderUpdateEvent extends WebSocketMessage {
  type: 'order:update'
  data: {
    orderId: string
    status: string
    timestamp: string
  }
}

export interface DeliveryUpdateEvent extends WebSocketMessage {
  type: 'delivery:update'
  data: {
    deliveryId: string
    status: string
    location?: {
      latitude: number
      longitude: number
    }
    timestamp: string
  }
}

export interface NotificationEvent extends WebSocketMessage {
  type: 'notification:new'
  data: {
    notificationId: string
    title: string
    message: string
    type: string
    priority: string
  }
}

// Error types
export interface ApiError {
  message: string
  code: string
  statusCode: number
  details?: any
  field?: string
}

export interface ValidationError extends ApiError {
  field: string
  errors: string[]
}

// Request/Response interceptors
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  data?: any
  params?: Record<string, any>
  timeout?: number
}

export interface ResponseInterceptor<T = any> {
  (response: ApiResponse<T>): ApiResponse<T>
}

export interface ErrorInterceptor {
  (error: ApiError): void
}

// API client configuration
export interface ApiClientConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
  interceptors: {
    request?: ((config: RequestConfig) => RequestConfig)[]
    response?: ResponseInterceptor[]
    error?: ErrorInterceptor[]
  }
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimitedResponse extends ApiResponse {
  rateLimit: RateLimitInfo
}

// File upload types
export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface FileUploadOptions {
  onProgress?: (progress: FileUploadProgress) => void
  timeout?: number
  headers?: Record<string, string>
}

// Geolocation types
export interface GeolocationRequest {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export interface GeolocationResponse {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  altitude?: number
  altitudeAccuracy?: number
  heading?: number
  speed?: number
}

// Push notification types
export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

// Real-time subscription types
export interface SubscriptionOptions {
  topics: string[]
  onMessage: (message: WebSocketMessage) => void
  onError?: (error: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectAttempts?: number
  reconnectInterval?: number
}

// Analytics types
export interface ApiMetrics {
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  timestamp: number
  userId?: string
  userAgent?: string
  ipAddress?: string
}

export interface ApiAnalytics {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  popularEndpoints: { endpoint: string; count: number }[]
  responseTimeDistribution: { range: string; count: number }[]
  hourlyTraffic: { hour: number; count: number }[]
  dailyTraffic: { date: string; count: number }[]
}