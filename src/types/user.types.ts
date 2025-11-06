import { UserRole } from '@prisma/client'

export interface User {
  id: string
  phoneNumber: string
  fullName: string | null
  email: string | null
  userRoles: UserRole[]
  activeRole: UserRole
  profileImageUrl: string | null
  emailVerified: boolean
  phoneVerified: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CustomerProfile {
  id: string
  userId: string
  user: User
  preferences: Record<string, any> | null
  createdAt: Date
  updatedAt: Date
}

export interface MerchantProfile {
  id: string
  userId: string
  user: User
  businessName: string
  description: string | null
  address: string
  latitude: number
  longitude: number
  category: string
  subcategory: string | null
  averageRating: number
  totalOrders: number
  openingHours: string | null
  closingHours: string | null
  isActive: boolean
  isVerified: boolean
  commissionRate: number
  createdAt: Date
  updatedAt: Date
}

export interface RiderProfile {
  id: string
  userId: string
  user: User
  vehicleType: string
  vehicleNumber: string | null
  licenseNumber: string | null
  isAvailable: boolean
  currentLat: number | null
  currentLng: number | null
  rating: number
  totalDeliveries: number
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  id: string
  userId: string
  user: User
  line1: string
  line2: string | null
  landmark: string | null
  city: string
  state: string
  pincode: string
  latitude: number | null
  longitude: number | null
  addressType: 'HOME' | 'WORK' | 'OTHER'
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Wallet {
  id: string
  userId: string
  user: User
  userType: 'merchant' | 'rider'
  currentBalance: number
  totalEarned: number
  totalWithdrawn: number
  lastUpdatedAt: Date
}

export interface WalletTransaction {
  id: string
  walletId: string
  wallet: Wallet
  orderId: string | null
  order: any | null
  amount: number
  transactionType: 'CREDIT' | 'DEBIT'
  description: string
  balanceAfter: number
  createdAt: Date
}

// Auth types
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
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface SwitchRoleRequest {
  role: UserRole
}

// Profile update types
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

// User stats
export interface UserStats {
  totalOrders: number
  totalSpent: number
  favoriteCategory: string
  averageRating: number
  joinDate: Date
}

export interface MerchantStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  customerSatisfaction: number
  topProducts: string[]
  businessDays: number
}

export interface RiderStats {
  totalDeliveries: number
  totalEarnings: number
  averageRating: number
  onTimeDeliveryRate: number
  averageDeliveryTime: number
  activeDays: number
}