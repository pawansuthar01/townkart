// Route Configuration
export const ROUTES = {
  // Public Routes
  HOME: "/",
  ABOUT: "/about",
  CONTACT: "/contact",
  PRIVACY: "/privacy",
  TERMS: "/terms",

  // Authentication Routes
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    VERIFY_OTP: "/verify-otp",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // Product Routes
  PRODUCTS: {
    LIST: "/products",
    DETAIL: (slug: string) => `/products/${slug}`,
    TRENDING: "/products/trending",
    SEARCH: "/products/search",
    CATEGORY: (name: string) => `/categories/${name}`,
  },

  // Collection Routes
  COLLECTIONS: {
    LIST: "/collections",
    DETAIL: (slug: string) => `/collections/${slug}`,
    TRENDING: "/collections/trending",
  },

  // Shopping Routes
  CART: "/cart",
  CHECKOUT: "/checkout",
  WISHLIST: "/wishlist",

  // Order Routes
  ORDERS: {
    LIST: "/orders",
    DETAIL: (id: string) => `/orders/${id}`,
    TRACKING: (id: string) => `/orders/${id}/tracking`,
  },

  // User Routes
  USER: {
    DASHBOARD: "/customer",
    PROFILE: "/customer/profile",
    ADDRESSES: "/customer/addresses",
    PAYMENT_METHODS: "/customer/payment-methods",
  },

  // Merchant Routes
  STORE: {
    DASHBOARD: "/store",
    PRODUCTS: "/store/products",
    ORDERS: "/store/orders",
    ANALYTICS: "/store/analytics",
    SETTINGS: "/store/settings",
  },

  // Rider Routes
  RIDER: {
    DASHBOARD: "/rider/dashboard",
    DELIVERIES: {
      AVAILABLE: "/rider/deliveries/available",
      ACTIVE: "/rider/deliveries/active",
      HISTORY: "/rider/deliveries/history",
    },
    EARNINGS: "/rider-earnings",
  },

  // Admin Routes
  ADMIN: {
    DASHBOARD: "/admin",
    USERS: "/admin/users",
    ORDERS: "/admin/orders",
    PRODUCTS: "/admin/products",
    MERCHANTS: "/admin/merchants",
    RIDERS: "/admin/riders",
    ANALYTICS: "/admin/analytics",
    SETTINGS: "/admin/settings",
    DELIVERY_CHARGES: "/admin/delivery-charges",
    DELIVERY_MONITORING: "/admin/delivery-monitoring",
  },

  // Utility Routes
  DELIVERY_CALCULATOR: "/delivery-calculator",
  OFFERS: "/offers",
  PAYMENT_TEST: "/payment-test",
  SPLASH: "/splash",
  UNAUTHORIZED: "/unauthorized",
};

// Route Groups (for middleware and layout purposes)
export const ROUTE_GROUPS = {
  PUBLIC: [
    ROUTES.HOME,
    ROUTES.ABOUT,
    ROUTES.CONTACT,
    ROUTES.PRIVACY,
    ROUTES.TERMS,
    ROUTES.DELIVERY_CALCULATOR,
    ROUTES.OFFERS,
  ],

  AUTH: [
    ROUTES.AUTH.LOGIN,
    ROUTES.AUTH.REGISTER,
    ROUTES.AUTH.VERIFY_OTP,
    ROUTES.AUTH.FORGOT_PASSWORD,
    ROUTES.AUTH.RESET_PASSWORD,
  ],

  CUSTOMER: [
    ROUTES.USER.DASHBOARD,
    ROUTES.CART,
    ROUTES.CHECKOUT,
    ROUTES.WISHLIST,
    ROUTES.ORDERS.LIST,
  ],

  STORE: [
    ROUTES.STORE.DASHBOARD,
    ROUTES.STORE.PRODUCTS,
    ROUTES.STORE.ORDERS,
    ROUTES.STORE.ANALYTICS,
    ROUTES.STORE.SETTINGS,
  ],

  RIDER: [
    ROUTES.RIDER.DASHBOARD,
    ROUTES.RIDER.DELIVERIES.AVAILABLE,
    ROUTES.RIDER.DELIVERIES.ACTIVE,
    ROUTES.RIDER.DELIVERIES.HISTORY,
    ROUTES.RIDER.EARNINGS,
  ],

  ADMIN: [
    ROUTES.ADMIN.DASHBOARD,
    ROUTES.ADMIN.USERS,
    ROUTES.ADMIN.ORDERS,
    ROUTES.ADMIN.PRODUCTS,
    ROUTES.ADMIN.MERCHANTS,
    ROUTES.ADMIN.RIDERS,
    ROUTES.ADMIN.ANALYTICS,
    ROUTES.ADMIN.SETTINGS,
    ROUTES.ADMIN.DELIVERY_CHARGES,
    ROUTES.ADMIN.DELIVERY_MONITORING,
  ],
};

// Dynamic Route Patterns (for route matching)
export const ROUTE_PATTERNS = {
  PRODUCT_DETAIL: /^\/products\/[^\/]+$/,
  ORDER_DETAIL: /^\/orders\/[^\/]+$/,
  ORDER_TRACKING: /^\/orders\/[^\/]+\/tracking$/,
  CATEGORY_DETAIL: /^\/categories\/[^\/]+$/,
  COLLECTION_DETAIL: /^\/collections\/[^\/]+$/,
};

// Route Metadata (for SEO, breadcrumbs, etc.)
export const ROUTE_METADATA = {
  [ROUTES.HOME]: {
    title: "TownKart - Local Shopping Made Easy",
    description:
      "Discover amazing products from trusted local shops with fast delivery",
  },
  [ROUTES.PRODUCTS.LIST]: {
    title: "All Products - TownKart",
    description:
      "Browse our complete collection of products from local merchants",
  },
  [ROUTES.CART]: {
    title: "Shopping Cart - TownKart",
    description: "Review and checkout your selected items",
  },
  [ROUTES.WISHLIST]: {
    title: "My Wishlist - TownKart",
    description: "Your saved items for later purchase",
  },
  [ROUTES.CHECKOUT]: {
    title: "Checkout - TownKart",
    description: "Complete your purchase securely",
  },
};

// Navigation Items Configuration
export const NAVIGATION_ITEMS = {
  MAIN: [
    { label: "Home", href: ROUTES.HOME, icon: "Home" },
    { label: "Products", href: ROUTES.PRODUCTS.LIST, icon: "Package" },
    { label: "Collections", href: ROUTES.COLLECTIONS.LIST, icon: "Grid" },
    { label: "Offers", href: ROUTES.OFFERS, icon: "Gift" },
    { label: "Contact", href: ROUTES.CONTACT, icon: "Phone" },
  ],

  CUSTOMER: [
    { label: "Dashboard", href: ROUTES.USER.DASHBOARD, icon: "User" },
    { label: "Orders", href: ROUTES.ORDERS.LIST, icon: "Package" },
    { label: "Wishlist", href: ROUTES.WISHLIST, icon: "Heart" },
    { label: "Cart", href: ROUTES.CART, icon: "ShoppingCart" },
  ],

  STORE: [
    { label: "Dashboard", href: ROUTES.STORE.DASHBOARD, icon: "Store" },
    { label: "Products", href: ROUTES.STORE.PRODUCTS, icon: "Package" },
    { label: "Orders", href: ROUTES.STORE.ORDERS, icon: "ClipboardList" },
    { label: "Analytics", href: ROUTES.STORE.ANALYTICS, icon: "BarChart" },
  ],

  RIDER: [
    { label: "Dashboard", href: ROUTES.RIDER.DASHBOARD, icon: "Bike" },
    {
      label: "Available Deliveries",
      href: ROUTES.RIDER.DELIVERIES.AVAILABLE,
      icon: "MapPin",
    },
    {
      label: "Active Deliveries",
      href: ROUTES.RIDER.DELIVERIES.ACTIVE,
      icon: "Truck",
    },
    {
      label: "Delivery History",
      href: ROUTES.RIDER.DELIVERIES.HISTORY,
      icon: "History",
    },
    { label: "Earnings", href: ROUTES.RIDER.EARNINGS, icon: "DollarSign" },
  ],

  ADMIN: [
    { label: "Dashboard", href: ROUTES.ADMIN.DASHBOARD, icon: "Shield" },
    { label: "Users", href: ROUTES.ADMIN.USERS, icon: "Users" },
    { label: "Orders", href: ROUTES.ADMIN.ORDERS, icon: "ClipboardList" },
    { label: "Products", href: ROUTES.ADMIN.PRODUCTS, icon: "Package" },
    { label: "Merchants", href: ROUTES.ADMIN.MERCHANTS, icon: "Store" },
    { label: "Riders", href: ROUTES.ADMIN.RIDERS, icon: "Bike" },
    { label: "Analytics", href: ROUTES.ADMIN.ANALYTICS, icon: "BarChart" },
    { label: "Settings", href: ROUTES.ADMIN.SETTINGS, icon: "Settings" },
  ],
};

// Breadcrumb Configuration
export const BREADCRUMB_CONFIG = {
  [ROUTES.PRODUCTS.LIST]: [
    { label: "Home", href: ROUTES.HOME },
    { label: "Products", href: ROUTES.PRODUCTS.LIST },
  ],
  [ROUTES.CART]: [
    { label: "Home", href: ROUTES.HOME },
    { label: "Cart", href: ROUTES.CART },
  ],
  [ROUTES.WISHLIST]: [
    { label: "Home", href: ROUTES.HOME },
    { label: "Wishlist", href: ROUTES.WISHLIST },
  ],
  [ROUTES.CHECKOUT]: [
    { label: "Home", href: ROUTES.HOME },
    { label: "Cart", href: ROUTES.CART },
    { label: "Checkout", href: ROUTES.CHECKOUT },
  ],
};
