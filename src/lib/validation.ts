import { z } from "zod";

// Auth Schemas
export const loginSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Please enter a valid Indian phone number"),
});

export const registerSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Please enter a valid Indian phone number"),
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z.string().email("Please enter a valid email address").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
  role: z.enum(["CUSTOMER", "MERCHANT", "RIDER"], {
    errorMap: () => ({ message: "Role must be CUSTOMER, MERCHANT, or RIDER" }),
  }),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Please enter a valid Indian phone number"),
  otp: z
    .string()
    .length(4, "OTP must be 4 digits")
    .regex(/^\d{4}$/, "OTP must contain only digits"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// User Schemas
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  email: z.string().email("Please enter a valid email address").optional(),
});

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
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(100, "Product name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  price: z.number().positive("Price must be greater than 0"),
  discountedPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  images: z
    .array(z.string().url())
    .max(5, "Maximum 5 images allowed")
    .optional(),
  isAvailable: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// Order Schemas
export const createOrderSchema = z.object({
  merchantId: z.string().min(1, "Merchant ID is required"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "Product ID is required"),
      quantity: z.number().int().positive("Quantity must be greater than 0"),
    }),
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
  paymentMethod: z.enum(["UPI", "CARD", "WALLET", "NET_BANKING"]),
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
export type SearchProductsInput = z.infer<typeof searchProductsSchema>;
export type SearchMerchantsInput = z.infer<typeof searchMerchantsSchema>;
