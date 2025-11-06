// App Constants
export const APP_CONFIG = {
  name: 'TownKart',
  description: 'Complete multi-role e-commerce platform for local businesses',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
}

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  MERCHANT: 'MERCHANT',
  RIDER: 'RIDER',
  ADMIN: 'ADMIN',
} as const

// Order Status
export const ORDER_STATUS = {
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const

// Payment Methods
export const PAYMENT_METHODS = {
  CASH_ON_DELIVERY: 'CASH_ON_DELIVERY',
  UPI: 'UPI',
  CARD: 'CARD',
  WALLET: 'WALLET',
  NET_BANKING: 'NET_BANKING',
} as const

// Delivery Status
export const DELIVERY_STATUS = {
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const

// Categories
export const CATEGORIES = {
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

// Subcategories
export const SUBCATEGORIES = {
  GROCERY: {
    VEGETABLES: 'Vegetables',
    FRUITS: 'Fruits',
    DAIRY: 'Dairy',
    BAKERY: 'Bakery',
    BEVERAGES: 'Beverages',
    SNACKS: 'Snacks',
  },
  FOOD: {
    RESTAURANT: 'Restaurant',
    CAFE: 'Cafe',
    FAST_FOOD: 'Fast Food',
    DESSERTS: 'Desserts',
    BEVERAGES: 'Beverages',
  },
  MEDICINE: {
    PHARMACY: 'Pharmacy',
    AYURVEDIC: 'Ayurvedic',
    HOMEOPATHY: 'Homeopathy',
  },
} as const

// Commission Rates
export const COMMISSION_RATES = {
  DEFAULT: 0.10, // 10%
  GROCERY: 0.08, // 8%
  FOOD: 0.12, // 12%
  MEDICINE: 0.05, // 5%
} as const

// Delivery Fees
export const DELIVERY_FEES = {
  BASE_FEE: 20,
  PER_KM_FEE: 5,
  FREE_DELIVERY_THRESHOLD: 500,
} as const

// Time Constants
export const TIME_CONSTANTS = {
  OTP_EXPIRY: 5 * 60 * 1000, // 5 minutes
  SESSION_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  ORDER_CONFIRMATION_TIMEOUT: 10 * 60 * 1000, // 10 minutes
  DELIVERY_ASSIGNMENT_TIMEOUT: 2 * 60 * 1000, // 2 minutes
  PAYMENT_TIMEOUT: 15 * 60 * 1000, // 15 minutes
} as const

// Distance Constants
export const DISTANCE_CONSTANTS = {
  MAX_DELIVERY_RADIUS: 10, // 10 km
  MIN_DELIVERY_RADIUS: 0.5, // 0.5 km
  RIDER_SEARCH_RADIUS: 2, // 2 km
} as const

// Rating Constants
export const RATING_CONSTANTS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  DEFAULT_RATING: 0,
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

// File Upload
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGES_PER_PRODUCT: 5,
} as const

// Notifications
export const NOTIFICATION_TYPES = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_ACCEPTED: 'ORDER_ACCEPTED',
  ORDER_READY: 'ORDER_READY',
  DELIVERY_ASSIGNED: 'DELIVERY_ASSIGNED',
  DELIVERY_PICKED_UP: 'DELIVERY_PICKED_UP',
  DELIVERY_OUT: 'DELIVERY_OUT',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  GENERAL: 'GENERAL',
} as const

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    VERIFY_OTP: '/api/auth/verify-otp',
    REFRESH_TOKEN: '/api/auth/refresh-token',
    LOGOUT: '/api/auth/logout',
  },
  USERS: {
    PROFILE: '/api/users/profile',
    ADDRESSES: '/api/users/addresses',
    SWITCH_ROLE: '/api/users/switch-role',
  },
  MERCHANTS: '/api/merchants',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  DELIVERIES: '/api/deliveries',
  PAYMENTS: '/api/payments',
  REVIEWS: '/api/reviews',
  NOTIFICATIONS: '/api/notifications',
  UPLOAD: '/api/upload',
} as const

// External APIs
export const EXTERNAL_APIS = {
  RAZORPAY: {
    BASE_URL: 'https://api.razorpay.com/v1',
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
  SMS: {
    MSG91: {
      BASE_URL: 'https://api.msg91.com/api/v2/sendsms',
      AUTH_KEY: process.env.MSG91_AUTH_KEY,
    },
  },
  MAPS: {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  OTP_INVALID: 'Invalid OTP. Please try again.',
  PHONE_EXISTS: 'Phone number already registered.',
  EMAIL_EXISTS: 'Email already registered.',
  INVALID_CREDENTIALS: 'Invalid credentials.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  OTP_SENT: 'OTP sent to your phone number.',
  OTP_VERIFIED: 'OTP verified successfully.',
  ORDER_PLACED: 'Order placed successfully!',
  PAYMENT_SUCCESS: 'Payment completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully.',
  ADDRESS_ADDED: 'Address added successfully.',
} as const

// Validation Rules
export const VALIDATION_RULES = {
  PHONE: {
    PATTERN: /^\+91[6-9]\d{9}$/,
    MESSAGE: 'Please enter a valid Indian phone number.',
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address.',
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    MESSAGE: 'Password must be at least 8 characters with uppercase, lowercase, number and special character.',
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    MESSAGE: 'Name must be between 2 and 50 characters.',
  },
  OTP: {
    LENGTH: 4,
    PATTERN: /^\d{4}$/,
    MESSAGE: 'OTP must be 4 digits.',
  },
} as const