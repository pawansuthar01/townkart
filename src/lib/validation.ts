import { z } from "zod";

// Auth Schemas
export const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, "Phone number or email is required")
    .refine((value) => {
      // Allow either phone number or email
      const phoneRegex = /^\+91[6-9]\d{9}$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return phoneRegex.test(value) || emailRegex.test(value);
    }, "Please enter a valid phone number (+91XXXXXXXXXX) or email address"),
});

export const registerSchema = z.object({
  phoneNumber: z
    .string()
    .regex(
      /^\+91[6-9]\d{9}$/,
      "Please enter a valid Indian phone number (e.g., +919876543210)"
    ),
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(5, "Email must be at least 5 characters")
    .max(100, "Email must be less than 100 characters")
    .refine((email) => {
      // Additional email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    }, "Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    ),
  role: z.enum(["CUSTOMER", "MERCHANT", "RIDER"], {
    errorMap: () => ({
      message: "Please select a valid role: Customer, Merchant, or Rider",
    }),
  }),
  token: z.string().optional(), // Invitation token for non-customer roles
});

export const verifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Please enter a valid Indian phone number"),
  otp: z
    .string()
    .length(4, "OTP must be 4 digits")
    .regex(/^\d{4}$/, "OTP must contain only digits"),
  deviceInfo: z
    .object({
      deviceId: z.string().min(1, "Device ID is required"),
      deviceName: z.string().optional(),
      deviceType: z.enum(["mobile", "desktop", "tablet"]).default("mobile"),
      os: z.string().optional(),
      browser: z.string().optional(),
      fingerprint: z.string().optional(),
    })
    .optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// User Schemas
export const updateProfileSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .optional(),
    email: z.string().email("Please enter a valid email address").optional(),
    profileImageUrl: z
      .string()
      .url("Please enter a valid image URL")
      .optional(),
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must be less than 100 characters")
      .optional(),
  })
  .refine(
    (data) => {
      // If newPassword is provided, currentPassword must also be provided
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Current password is required to set a new password",
      path: ["currentPassword"],
    }
  );

export const addressSchema = z.object({
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z
    .string()
    .length(6, "Pincode must be 6 digits")
    .regex(/^\d{6}$/, "Pincode must contain only digits"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  addressType: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
  isDefault: z.boolean().default(false),
});

// Merchant Schemas
export const createMerchantSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  address: z.string().min(1, "Address is required"),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  openingHours: z.string().optional(),
  closingHours: z.string().optional(),
});

// Product Schemas
export const createProductSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(100, "Product name must be less than 100 characters"),
  slug: z.string().optional(),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  shortDescription: z
    .string()
    .max(300, "Short description must be less than 300 characters")
    .optional(),
  sku: z.string().max(50, "SKU must be less than 50 characters").optional(),
  barcode: z
    .string()
    .max(50, "Barcode must be less than 50 characters")
    .optional(),
  brand: z.string().max(50, "Brand must be less than 50 characters").optional(),

  // Pricing
  price: z.number().positive("Price must be greater than 0"),
  discountedPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  taxRate: z.number().min(0).max(100).default(0),

  // Inventory
  stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
  minStockLevel: z.number().int().min(0).default(0),
  maxStockLevel: z.number().int().positive().optional(),

  // Categories & Classification
  categoryName: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),

  // Product Details
  weight: z.number().positive().optional(), // in grams
  dimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),
  packageWeight: z.number().positive().optional(),
  packageDimensions: z
    .object({
      length: z.number().positive(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .optional(),

  // Specifications & Attributes
  specifications: z.record(z.string()).optional(), // Key-value pairs
  features: z.array(z.string()).optional(),

  // Media
  imageUrls: z.array(z.string().url()).optional(),
  videos: z.array(z.string().url()).optional(),
  documents: z.array(z.string().url()).optional(),

  // SEO & Marketing
  metaTitle: z
    .string()
    .max(60, "Meta title must be less than 60 characters")
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description must be less than 160 characters")
    .optional(),
  seoUrl: z.string().optional(),

  // Status & Visibility
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  requiresShipping: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// Product Review Schemas
export const createProductReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  orderId: z.string().optional(),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  title: z
    .string()
    .max(100, "Title must be less than 100 characters")
    .optional(),
  comment: z
    .string()
    .max(1000, "Comment must be less than 1000 characters")
    .optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  images: z
    .array(z.string().url())
    .max(5, "Maximum 5 images allowed")
    .optional(),
  videos: z
    .array(z.string().url())
    .max(3, "Maximum 3 videos allowed")
    .optional(),
});

// Product Variant Schemas
export const createProductVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  price: z.number().positive().optional(),
  discountedPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  attributes: z.record(z.string()),
  images: z.array(z.string().url()).optional(),
});

// Product Image Schemas
export const createProductImageSchema = z.object({
  url: z.string().url("Valid image URL is required"),
  alt: z.string().max(100).optional(),
  caption: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

// Product Category Schemas
export const createProductCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  slug: z.string().min(1, "Category slug is required").max(50),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

// Product Attribute Schemas
export const createProductAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name is required").max(50),
  values: z.array(z.string()).min(1, "At least one value is required"),
  sortOrder: z.number().int().min(0).default(0),
});

// Offer Schemas
export const createOfferSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  type: z.enum([
    "PERCENTAGE_DISCOUNT",
    "FIXED_DISCOUNT",
    "FREE_SHIPPING",
    "BUY_ONE_GET_ONE",
    "BUNDLE_DISCOUNT",
  ]),
  discountValue: z.number().positive("Discount value must be positive"),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().min(0).default(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  applicableTo: z.enum([
    "ALL_PRODUCTS",
    "SPECIFIC_PRODUCTS",
    "SPECIFIC_CATEGORIES",
    "SPECIFIC_MERCHANTS",
  ]),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  merchantIds: z.array(z.string()).optional(),
  targetUsers: z.enum([
    "ALL_USERS",
    "SPECIFIC_USERS",
    "NEW_USERS",
    "RETURNING_USERS",
    "LOYAL_CUSTOMERS",
    "FIRST_TIME_USERS",
  ]),
  userIds: z.array(z.string()).optional(),
  userSegments: z.array(z.string()).optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  couponCode: z.string().max(20).optional(),
  isAutoApply: z.boolean().default(false),
  priority: z.number().int().min(0).default(0),
  terms: z.string().max(1000).optional(),
});

// Collection Schemas
export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100),
  description: z.string().max(500).optional(),
  products: z.array(
    z.object({
      productId: z.string(),
      sortOrder: z.number().int().min(0).default(0),
    })
  ),
  type: z.enum([
    "MANUAL",
    "DYNAMIC",
    "FEATURED_PRODUCTS",
    "BEST_SELLERS",
    "NEW_ARRIVALS",
    "ON_SALE",
  ]),
  filters: z.record(z.any()).optional(),
  image: z.string().url().optional(),
  bannerImage: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  targetUsers: z.enum(["ALL_USERS", "SPECIFIC_USERS", "USER_SEGMENTS"]),
  userSegments: z.array(z.string()).optional(),
});

// Coupon Schemas
export const createCouponSchema = z.object({
  code: z.string().min(1, "Code is required").max(20),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  value: z.number().positive("Value must be positive"),
  maxDiscount: z.number().positive().optional(),
  minOrderValue: z.number().min(0).default(0),
  maxUses: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// Order Schemas
export const createOrderSchema = z.object({
  merchantId: z.string().min(1, "Merchant ID is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID is required"),
      quantity: z.number().int().positive("Quantity must be greater than 0"),
    })
  ),
  deliveryAddress: addressSchema,
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "UPI", "CARD", "WALLET"]),
  specialInstructions: z
    .string()
    .max(200, "Instructions must be less than 200 characters")
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING_CONFIRMATION",
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
});

// Delivery Schemas
export const acceptDeliverySchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum([
    "ASSIGNED",
    "PICKED_UP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
  pickupOtp: z
    .string()
    .length(4)
    .regex(/^\d{4}$/)
    .optional(),
  deliveryOtp: z
    .string()
    .length(4)
    .regex(/^\d{4}$/)
    .optional(),
  proofPhotoUrl: z.string().url().optional(),
});

// Payment Schemas
export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentMethod: z.enum([
    "UPI",
    "CARD",
    "WALLET",
    "NET_BANKING",
    "CASH_ON_DELIVERY",
  ]),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  paymentId: z.string().min(1, "Payment ID is required"),
  signature: z.string().min(1, "Signature is required"),
});

// Review Schemas
export const createReviewSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  merchantRating: z.number().int().min(1).max(5).optional(),
  riderRating: z.number().int().min(1).max(5).optional(),
  comment: z
    .string()
    .max(500, "Comment must be less than 500 characters")
    .optional(),
});

// Notification Schemas
export const createNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  notificationType: z.enum([
    "ORDER_CREATED",
    "ORDER_ACCEPTED",
    "ORDER_READY",
    "DELIVERY_ASSIGNED",
    "DELIVERY_PICKED_UP",
    "DELIVERY_OUT",
    "ORDER_DELIVERED",
    "ORDER_CANCELLED",
    "PAYMENT_SUCCESS",
    "PAYMENT_FAILED",
    "GENERAL",
  ]),
  referenceId: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

// Search and Filter Schemas
export const searchProductsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  merchantId: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "rating", "newest", "popularity"])
    .optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const searchMerchantsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().positive().max(50).default(10), // km
  sortBy: z.enum(["distance", "rating", "newest", "popularity"]).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// File Upload Schemas
export const uploadFileSchema = z.object({
  file: z.any(), // This would be validated on the server side
  type: z.enum(["image", "document"]),
  folder: z.string().optional(),
});

// API Response Schemas
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  });

export const paginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateProductReviewInput = z.infer<
  typeof createProductReviewSchema
>;
export type CreateProductVariantInput = z.infer<
  typeof createProductVariantSchema
>;
export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
export type CreateProductCategoryInput = z.infer<
  typeof createProductCategorySchema
>;
export type CreateProductAttributeInput = z.infer<
  typeof createProductAttributeSchema
>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type AcceptDeliveryInput = z.infer<typeof acceptDeliverySchema>;
export type UpdateDeliveryStatusInput = z.infer<
  typeof updateDeliveryStatusSchema
>;
export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
export type SearchMerchantsInput = z.infer<typeof searchMerchantsSchema>;
