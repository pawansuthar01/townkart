// Site Configuration
export const SITE_CONFIG = {
  // Basic Site Information
  name: "TownKart",
  description:
    "Local Shopping Made Easy - Discover amazing products from trusted local shops with fast delivery",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ogImage: "/images/og-image.jpg",

  // Contact Information
  contact: {
    email: "support@townkart.com",
    phone: "+91-1234567890",
    address: {
      street: "123 Shopping Street",
      city: "Your City",
      state: "Your State",
      pincode: "123456",
      country: "India",
    },
  },

  // Social Media Links
  social: {
    facebook: "https://facebook.com/townkart",
    twitter: "https://twitter.com/townkart",
    instagram: "https://instagram.com/townkart",
    linkedin: "https://linkedin.com/company/townkart",
    youtube: "https://youtube.com/townkart",
  },

  // Business Information
  business: {
    gstNumber: "GST123456789",
    panNumber: "PAN123456789",
    registrationNumber: "REG123456789",
    foundingYear: 2024,
  },

  // Delivery Information
  delivery: {
    freeDeliveryThreshold: 500,
    baseDeliveryCharge: 40,
    estimatedDeliveryTime: "30-60 minutes",
    serviceableRadius: 25, // km
    operatingHours: {
      start: "06:00",
      end: "22:00",
    },
  },

  // Payment Information
  payment: {
    supportedMethods: [
      "UPI",
      "Credit Card",
      "Debit Card",
      "Net Banking",
      "Wallets",
      "COD",
    ],
    codLimit: 1000,
    razorpay: {
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    },
  },

  // Features
  features: {
    realTimeTracking: true,
    contactlessDelivery: true,
    qualityAssurance: true,
    customerSupport: true,
    multiLanguage: false,
    darkMode: false,
  },

  // Categories
  categories: [
    "Grocery",
    "Food",
    "Medicine",
    "Fashion",
    "Electronics",
    "Household",
    "Beauty",
    "Sports",
    "Books",
    "Toys",
  ],

  // Supported Cities
  cities: [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Kolkata",
    "Hyderabad",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Surat",
  ],

  // App Information
  app: {
    version: "1.0.0",
    androidUrl: "https://play.google.com/store/apps/details?id=com.townkart",
    iosUrl: "https://apps.apple.com/app/townkart/id123456789",
    pwa: true,
  },

  // Analytics & Tracking
  analytics: {
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
    facebookPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID,
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
  },

  // SEO Configuration
  seo: {
    defaultTitle: "TownKart - Local Shopping Made Easy",
    titleTemplate: "%s | TownKart",
    defaultDescription:
      "Discover amazing products from trusted local shops with fast delivery",
    siteName: "TownKart",
    twitterHandle: "@townkart",
    locale: "en_IN",
    type: "website",
  },

  // Performance Configuration
  performance: {
    imageOptimization: true,
    lazyLoading: true,
    prefetching: true,
    caching: {
      static: 86400, // 24 hours
      dynamic: 3600, // 1 hour
    },
  },

  // Security Configuration
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
    enableCSRFProtection: true,
    rateLimiting: {
      maxRequests: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
  },

  // Development Configuration
  development: {
    debug: process.env.NODE_ENV === "development",
    mockApi: false,
    enableDevTools: true,
  },
};

// Theme Configuration (extends theme.config.ts)
export const THEME_CONFIG = {
  colors: {
    primary: "#FF6B35",
    secondary: "#F7931E",
    accent: "#4CAF50",
    danger: "#F44336",
    warning: "#FF9800",
    info: "#2196F3",
    success: "#4CAF50",
    light: "#F5F5F5",
    dark: "#212121",
  },

  fonts: {
    primary: "Inter, sans-serif",
    secondary: "Poppins, sans-serif",
    mono: "JetBrains Mono, monospace",
  },

  breakpoints: {
    xs: "0px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },

  borderRadius: {
    none: "0",
    sm: "0.125rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px",
  },

  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
};

// Environment Configuration
export const ENV_CONFIG = {
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  isTest: process.env.NODE_ENV === "test",

  // API URLs
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000",

  // External Services
  razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  googleMapsKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
  firebaseConfig: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },

  // Feature Flags
  features: {
    enableNotifications: true,
    enableRealTimeTracking: true,
    enablePushNotifications: false,
    enableOfflineMode: false,
    enableMultiLanguage: false,
    enableDarkMode: false,
  },
};
