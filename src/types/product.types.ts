export interface Product {
  id: string
  merchantId: string
  merchant: any // MerchantProfile
  name: string
  description: string | null
  price: number
  discountedPrice: number | null
  stockQuantity: number
  category: string
  subcategory: string | null
  images: string[] | null
  isAvailable: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductWithMerchant extends Product {
  merchant: {
    id: string
    businessName: string
    address: string
    latitude: number
    longitude: number
    averageRating: number
  }
  distance?: number // Distance from user location
}

export interface ProductSearchFilters {
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

export interface ProductStats {
  totalSold: number
  revenue: number
  averageRating: number
  viewCount: number
  favoriteCount: number
  lastSoldAt: Date | null
}

export interface ProductDashboardData {
  product: Product
  stats: ProductStats
  recentOrders: any[] // OrderItem[]
  stockAlerts: boolean
  performance: {
    salesTrend: number[]
    ratingTrend: number[]
  }
}

// Product categories and subcategories
export const PRODUCT_CATEGORIES = {
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

export const PRODUCT_SUBCATEGORIES = {
  GROCERY: {
    VEGETABLES: 'Vegetables',
    FRUITS: 'Fruits',
    DAIRY: 'Dairy',
    BAKERY: 'Bakery',
    BEVERAGES: 'Beverages',
    SNACKS: 'Snacks',
    CANNED_GOODS: 'Canned Goods',
    SPICES: 'Spices',
  },
  FOOD: {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    DINNER: 'Dinner',
    SNACKS: 'Snacks',
    BEVERAGES: 'Beverages',
    DESSERTS: 'Desserts',
  },
  MEDICINE: {
    TABLETS: 'Tablets',
    SYRUPS: 'Syrups',
    INJECTIONS: 'Injections',
    CREAMS: 'Creams',
    DROPS: 'Drops',
    AYURVEDIC: 'Ayurvedic',
  },
  FASHION: {
    MEN: 'Men',
    WOMEN: 'Women',
    KIDS: 'Kids',
    ACCESSORIES: 'Accessories',
  },
  ELECTRONICS: {
    MOBILES: 'Mobiles',
    LAPTOPS: 'Laptops',
    HEADPHONES: 'Headphones',
    CHARGERS: 'Chargers',
    ACCESSORIES: 'Accessories',
  },
} as const

export type ProductCategory = keyof typeof PRODUCT_CATEGORIES
export type GrocerySubcategory = keyof typeof PRODUCT_SUBCATEGORIES.GROCERY
export type FoodSubcategory = keyof typeof PRODUCT_SUBCATEGORIES.FOOD
export type MedicineSubcategory = keyof typeof PRODUCT_SUBCATEGORIES.MEDICINE
export type FashionSubcategory = keyof typeof PRODUCT_SUBCATEGORIES.FASHION
export type ElectronicsSubcategory = keyof typeof PRODUCT_SUBCATEGORIES.ELECTRONICS

// Product pricing helpers
export function calculateDiscountPercentage(originalPrice: number, discountedPrice: number): number {
  if (originalPrice === 0) return 0
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

export function getEffectivePrice(product: Product): number {
  return product.discountedPrice ?? product.price
}

export function isOnSale(product: Product): boolean {
  return product.discountedPrice !== null && product.discountedPrice < product.price
}

// Product availability helpers
export function isProductAvailable(product: Product): boolean {
  return product.isAvailable && product.stockQuantity > 0
}

export function getStockStatus(product: Product): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (!product.isAvailable) return 'out_of_stock'
  if (product.stockQuantity === 0) return 'out_of_stock'
  if (product.stockQuantity <= 5) return 'low_stock'
  return 'in_stock'
}

export function getStockStatusColor(status: string): string {
  switch (status) {
    case 'in_stock':
      return 'text-green-600'
    case 'low_stock':
      return 'text-yellow-600'
    case 'out_of_stock':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export function getStockStatusText(status: string): string {
  switch (status) {
    case 'in_stock':
      return 'In Stock'
    case 'low_stock':
      return 'Low Stock'
    case 'out_of_stock':
      return 'Out of Stock'
    default:
      return 'Unknown'
  }
}

// Product image helpers
export function getProductImageUrl(product: Product, index: number = 0): string {
  if (!product.images || product.images.length === 0) {
    return '/images/product-placeholder.png'
  }
  return product.images[index] || product.images[0]
}

export function getProductThumbnail(product: Product): string {
  return getProductImageUrl(product, 0)
}

// Product search and filtering
export function matchesSearchQuery(product: Product, query: string): boolean {
  const searchTerm = query.toLowerCase()
  return (
    product.name.toLowerCase().includes(searchTerm) ||
    product.description?.toLowerCase().includes(searchTerm) ||
    product.category.toLowerCase().includes(searchTerm) ||
    product.subcategory?.toLowerCase().includes(searchTerm)
  )
}

export function matchesCategory(product: Product, category: string): boolean {
  return product.category.toLowerCase() === category.toLowerCase()
}

export function matchesPriceRange(product: Product, minPrice?: number, maxPrice?: number): boolean {
  const price = getEffectivePrice(product)
  if (minPrice !== undefined && price < minPrice) return false
  if (maxPrice !== undefined && price > maxPrice) return false
  return true
}

export function matchesMerchant(product: Product, merchantId: string): boolean {
  return product.merchantId === merchantId
}

// Product sorting
export type ProductSortOption = 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity'

export function sortProducts(products: Product[], sortBy: ProductSortOption): Product[] {
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return getEffectivePrice(a) - getEffectivePrice(b)
      case 'price_desc':
        return getEffectivePrice(b) - getEffectivePrice(a)
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'rating':
        // Assuming we have rating in the product or need to calculate it
        return 0 // Placeholder
      case 'popularity':
        // Assuming we have popularity metrics
        return 0 // Placeholder
      default:
        return 0
    }
  })
}

// Product validation
export function validateProductData(data: Partial<CreateProductRequest>): string[] {
  const errors: string[] = []

  if (!data.name?.trim()) {
    errors.push('Product name is required')
  } else if (data.name.length < 2) {
    errors.push('Product name must be at least 2 characters')
  } else if (data.name.length > 100) {
    errors.push('Product name must be less than 100 characters')
  }

  if (data.price !== undefined && data.price <= 0) {
    errors.push('Price must be greater than 0')
  }

  if (data.discountedPrice !== undefined && data.discountedPrice < 0) {
    errors.push('Discounted price cannot be negative')
  }

  if (data.discountedPrice !== undefined && data.price !== undefined && data.discountedPrice >= data.price) {
    errors.push('Discounted price must be less than original price')
  }

  if (data.stockQuantity !== undefined && data.stockQuantity < 0) {
    errors.push('Stock quantity cannot be negative')
  }

  if (!data.category?.trim()) {
    errors.push('Category is required')
  }

  if (data.description && data.description.length > 500) {
    errors.push('Description must be less than 500 characters')
  }

  if (data.images && data.images.length > 5) {
    errors.push('Maximum 5 images allowed')
  }

  return errors
}