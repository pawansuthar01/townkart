export interface Shop {
  id: string
  merchantId: string
  merchant: any // MerchantProfile
  name: string
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

export interface ShopWithProducts extends Shop {
  products: Product[]
  distance?: number // Distance from user location
}

export interface ShopSearchFilters {
  query?: string
  category?: string
  latitude?: number
  longitude?: number
  radius?: number // in kilometers
  sortBy?: 'distance' | 'rating' | 'newest' | 'popularity'
  page?: number
  limit?: number
}

export interface ShopStats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  customerSatisfaction: number
  topSellingProducts: Product[]
  salesByCategory: Record<string, number>
  peakHours: string[]
}

export interface CreateShopRequest {
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

export interface UpdateShopRequest extends Partial<CreateShopRequest> {
  id: string
  isActive?: boolean
}

export interface ShopDashboardData {
  shop: Shop
  stats: ShopStats
  recentOrders: any[] // Order[]
  lowStockProducts: Product[]
  todayRevenue: number
  todayOrders: number
  pendingOrders: number
}

// Shop categories and subcategories
export const SHOP_CATEGORIES = {
  GROCERY: 'Grocery',
  FOOD: 'Food',
  MEDICINE: 'Medicine',
  FASHION: 'Fashion',
  ELECTRONICS: 'Electronics',
  BOOKS: 'Books',
  HOUSEHOLD: 'Household',
  BEAUTY: 'Beauty',
  SPORTS: 'Sports',
  TOYS: 'Toys',
} as const

export const SHOP_SUBCATEGORIES = {
  GROCERY: {
    SUPERMARKET: 'Supermarket',
    VEGETABLES: 'Vegetables',
    FRUITS: 'Fruits',
    DAIRY: 'Dairy',
    BAKERY: 'Bakery',
    BEVERAGES: 'Beverages',
  },
  FOOD: {
    RESTAURANT: 'Restaurant',
    CAFE: 'Cafe',
    FAST_FOOD: 'Fast Food',
    DESSERTS: 'Desserts',
    STREET_FOOD: 'Street Food',
  },
  MEDICINE: {
    PHARMACY: 'Pharmacy',
    AYURVEDIC: 'Ayurvedic',
    HOMEOPATHY: 'Homeopathy',
    MEDICAL_STORE: 'Medical Store',
  },
  FASHION: {
    CLOTHING: 'Clothing',
    FOOTWEAR: 'Footwear',
    ACCESSORIES: 'Accessories',
    JEWELRY: 'Jewelry',
  },
  ELECTRONICS: {
    MOBILES: 'Mobiles',
    LAPTOPS: 'Laptops',
    ACCESSORIES: 'Accessories',
    GADGETS: 'Gadgets',
  },
} as const

export type ShopCategory = keyof typeof SHOP_CATEGORIES
export type GrocerySubcategory = keyof typeof SHOP_SUBCATEGORIES.GROCERY
export type FoodSubcategory = keyof typeof SHOP_SUBCATEGORIES.FOOD
export type MedicineSubcategory = keyof typeof SHOP_SUBCATEGORIES.MEDICINE
export type FashionSubcategory = keyof typeof SHOP_SUBCATEGORIES.FASHION
export type ElectronicsSubcategory = keyof typeof SHOP_SUBCATEGORIES.ELECTRONICS

// Shop timing helpers
export interface ShopTiming {
  day: string
  open: string
  close: string
  isOpen: boolean
}

export interface ShopTimings {
  monday: ShopTiming
  tuesday: ShopTiming
  wednesday: ShopTiming
  thursday: ShopTiming
  friday: ShopTiming
  saturday: ShopTiming
  sunday: ShopTiming
}

export function parseShopTimings(timingString: string): ShopTimings | null {
  try {
    return JSON.parse(timingString)
  } catch {
    return null
  }
}

export function isShopOpen(openingHours: string | null, closingHours: string | null): boolean {
  if (!openingHours || !closingHours) return true // Assume open if no hours specified

  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const [openHour, openMinute] = openingHours.split(':').map(Number)
  const [closeHour, closeMinute] = closingHours.split(':').map(Number)

  const openTime = openHour * 60 + openMinute
  const closeTime = closeHour * 60 + closeMinute

  return currentTime >= openTime && currentTime <= closeTime
}

// Shop location helpers
export function calculateDistanceFromShop(
  shopLat: number,
  shopLng: number,
  userLat: number,
  userLng: number
): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = ((userLat - shopLat) * Math.PI) / 180
  const dLng = ((userLng - shopLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((shopLat * Math.PI) / 180) *
      Math.cos((userLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}

export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

// Shop rating helpers
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600'
  if (rating >= 4.0) return 'text-yellow-600'
  if (rating >= 3.0) return 'text-orange-600'
  return 'text-red-600'
}

export function getRatingStars(rating: number): number {
  return Math.round(rating * 2) / 2 // Round to nearest 0.5
}

// Import Product type for compatibility
interface Product {
  id: string
  name: string
  price: number
  stockQuantity: number
  category: string
  isAvailable: boolean
}