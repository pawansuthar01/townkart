// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  TIMEOUT: 10000, // 10 seconds

  // Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      LOGOUT: "/api/auth/logout",
      REFRESH: "/api/auth/refresh-token",
      VERIFY_OTP: "/api/auth/verify-otp",
      SESSIONS: "/api/auth/sessions",
    },

    // Products
    PRODUCTS: "/api/products",
    CATEGORIES: "/api/categories",
    COLLECTIONS: "/api/collections",

    // Orders
    ORDERS: "/api/orders",
    ORDER_STATUS: "/api/orders/status",

    // Cart & Wishlist
    CART: "/api/cart",
    WISHLIST: "/api/wishlist",

    // User
    USER: {
      PROFILE: "/api/users/profile",
      ADDRESSES: "/api/users/addresses",
    },

    // Shops & Merchants
    SHOPS: "/api/shops",
    MERCHANTS: "/api/merchants",

    // Delivery
    DELIVERY: {
      AVAILABLE: "/api/deliveries/available",
      CHARGES: "/api/deliveries/charges",
      TRACKING: "/api/deliveries/tracking",
    },

    // Payments
    PAYMENTS: "/api/payments",
    WEBHOOKS: {
      RAZORPAY: "/api/webhooks/razorpay",
    },

    // Notifications
    NOTIFICATIONS: "/api/notifications",

    // Stats & Analytics
    STATS: "/api/stats",

    // Special Offers
    OFFERS: "/api/special-offers",

    // Upload
    UPLOAD: "/api/upload",
  },

  // HTTP Methods
  METHODS: {
    GET: "GET",
    POST: "POST",
    PUT: "PUT",
    PATCH: "PATCH",
    DELETE: "DELETE",
  },

  // Headers
  HEADERS: {
    CONTENT_TYPE: {
      JSON: "application/json",
      FORM_DATA: "multipart/form-data",
    },
    AUTHORIZATION: "Authorization",
  },

  // Status Codes
  STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },

  // Cache
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    SHORT_TTL: 1 * 60 * 1000, // 1 minute
    LONG_TTL: 30 * 60 * 1000, // 30 minutes
  },

  // Retry
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // 1 second
    BACKOFF_MULTIPLIER: 2,
  },
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Error Types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Request Configuration
export interface RequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

// Pagination Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Common Query Parameters
export interface CommonQueryParams extends PaginationParams {
  search?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}
