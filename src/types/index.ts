// Re-export all types
export * from './user.types'
export * from './shop.types'
export * from './product.types'
export * from './order.types'
export * from './delivery.types'
export * from './payment.types'
export * from './api.types'

// Common types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Address {
  line1: string
  line2?: string
  landmark?: string
  city: string
  state: string
  pincode: string
  latitude?: number
  longitude?: number
}

export interface ImageData {
  url: string
  alt?: string
  width?: number
  height?: number
}

export interface NotificationData {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
  referenceId?: string
}

export interface SearchFilters {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sortBy?: string
  page?: number
  limit?: number
}

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

// Form types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: any
}

export interface FormData {
  [key: string]: any
}

// Component props types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
}

export interface TableColumn<T = any> {
  key: keyof T | string
  title: string
  render?: (value: any, record: T) => React.ReactNode
  sortable?: boolean
  width?: string | number
}

export interface TableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pagination?: {
    current: number
    total: number
    pageSize: number
    onChange: (page: number) => void
  }
  onRowClick?: (record: T) => void
}

// Hook types
export interface UseAuthReturn {
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: any) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
}

export interface UseCartReturn {
  items: any[]
  total: number
  addItem: (item: any) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

export interface UseOrdersReturn {
  orders: any[]
  isLoading: boolean
  fetchOrders: (filters?: any) => Promise<void>
  createOrder: (data: any) => Promise<any>
  updateOrder: (id: string, data: any) => Promise<any>
}

// Store types
export interface RootState {
  auth: AuthState
  cart: CartState
  orders: OrdersState
  ui: UIState
}

export interface AuthState {
  user: any
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface CartState {
  items: any[]
  total: number
  isLoading: boolean
}

export interface OrdersState {
  orders: any[]
  currentOrder: any
  isLoading: boolean
  error: string | null
}

export interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  modal: {
    isOpen: boolean
    type: string | null
    data: any
  }
  notifications: NotificationData[]
}

// API types
export interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

export interface RequestConfig extends Partial<ApiConfig> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  params?: Record<string, any>
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

// Event types
export interface CustomEvent<T = any> {
  type: string
  payload: T
  timestamp: number
}

export interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}

// Error types
export interface ApiError {
  message: string
  code: string
  statusCode: number
  details?: any
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// File types
export interface FileUploadResult {
  url: string
  filename: string
  size: number
  type: string
}

export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
}