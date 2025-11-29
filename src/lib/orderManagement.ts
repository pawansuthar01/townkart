// Order Management Utilities

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  images?: string[];
  variant?: string;
}

export interface OrderAddress {
  id?: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  type: "home" | "work" | "other";
}

export interface OrderSummary {
  subtotal: number;
  deliveryCharge: number;
  tax: number;
  discount: number;
  total: number;
  savings: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  items: OrderItem[];
  address: OrderAddress;
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  orderStatus:
    | "placed" // ORDER_PLACED
    | "confirmed" // STORE_ASSIGNED
    | "preparing" // BEING_PREPARED
    | "ready" // READY_FOR_PICKUP
    | "picked_up" // RIDER_ASSIGNED
    | "delivered" // EN_ROUTE -> DELIVERED
    | "cancelled";
  summary: OrderSummary;
  deliveryTime?: string;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderFilter {
  status?: string;
  paymentStatus?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Order status flow - Updated for store-based system
// Note: Maps to new enum values after migration
export const ORDER_STATUS_FLOW = {
  // ORDER_PLACED (new) -> STORE_ASSIGNED (new) -> BEING_PREPARED (new)
  placed: { next: "confirmed", label: "Order Placed", color: "bg-blue-500" },
  confirmed: {
    next: "preparing",
    label: "Store Assigned",
    color: "bg-blue-600",
  },
  preparing: { next: "ready", label: "Being Prepared", color: "bg-orange-500" },

  // READY_FOR_PICKUP -> RIDER_ASSIGNED (new) -> EN_ROUTE (new) -> DELIVERED
  ready: {
    next: "picked_up",
    label: "Ready for Pickup",
    color: "bg-purple-500",
  },
  picked_up: {
    next: "delivered",
    label: "Rider Assigned",
    color: "bg-indigo-500",
  },
  // Note: "picked_up" represents RIDER_ASSIGNED, "delivered" represents EN_ROUTE -> DELIVERED
  delivered: { next: null, label: "Delivered", color: "bg-green-600" },
  cancelled: { next: null, label: "Cancelled", color: "bg-red-500" },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_FLOW;

// Calculate order summary
export function calculateOrderSummary(
  items: OrderItem[],
  deliveryCharge: number = 0,
  taxRate: number = 0.18, // 18% GST
  discount: number = 0,
): OrderSummary {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = (subtotal + deliveryCharge - discount) * taxRate;
  const total = subtotal + deliveryCharge + tax - discount;
  const savings = discount;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryCharge: Math.round(deliveryCharge * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    savings: Math.round(savings * 100) / 100,
  };
}

// Generate unique order number
export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `TK${timestamp}${random}`;
}

// Validate order data
export function validateOrderData(orderData: Partial<Order>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!orderData.customerId) {
    errors.push("Customer ID is required");
  }

  if (!orderData.items || orderData.items.length === 0) {
    errors.push("At least one item is required");
  }

  if (!orderData.address) {
    errors.push("Delivery address is required");
  } else {
    const address = orderData.address;
    if (!address.fullName) errors.push("Full name is required");
    if (!address.phoneNumber) errors.push("Phone number is required");
    if (!address.addressLine1) errors.push("Address line 1 is required");
    if (!address.city) errors.push("City is required");
    if (!address.state) errors.push("State is required");
    if (!address.pincode) errors.push("Pincode is required");
  }

  if (!orderData.paymentMethod) {
    errors.push("Payment method is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Check if order can be cancelled
export function canCancelOrder(order: Order): {
  canCancel: boolean;
  reason?: string;
} {
  const cancellableStatuses: OrderStatus[] = ["placed", "confirmed"];
  const nonCancellableStatuses: OrderStatus[] = [
    "preparing",
    "ready",
    "picked_up",
    "delivered",
  ];

  if (cancellableStatuses.includes(order.orderStatus as OrderStatus)) {
    return { canCancel: true };
  }

  if (nonCancellableStatuses.includes(order.orderStatus as OrderStatus)) {
    return {
      canCancel: false,
      reason: `Order cannot be cancelled as it is ${ORDER_STATUS_FLOW[order.orderStatus as OrderStatus].label.toLowerCase()}`,
    };
  }

  if (order.orderStatus === "cancelled") {
    return {
      canCancel: false,
      reason: "Order is already cancelled",
    };
  }

  return {
    canCancel: false,
    reason: "Order status unknown",
  };
}

// Calculate cancellation refund amount
export function calculateCancellationRefund(order: Order): {
  refundAmount: number;
  refundPercentage: number;
  reason: string;
} {
  const { orderStatus, summary } = order;

  switch (orderStatus) {
    case "placed":
      return {
        refundAmount: summary.total,
        refundPercentage: 100,
        reason: "Full refund for cancelled order",
      };

    case "confirmed":
      return {
        refundAmount: summary.total,
        refundPercentage: 100,
        reason: "Full refund for confirmed order cancellation",
      };

    case "preparing":
      const preparingRefund = summary.total * 0.7; // 70% refund
      return {
        refundAmount: Math.round(preparingRefund * 100) / 100,
        refundPercentage: 70,
        reason: "Partial refund after preparation started",
      };

    default:
      return {
        refundAmount: 0,
        refundPercentage: 0,
        reason: "No refund available for this order status",
      };
  }
}

// Get order status color
export function getOrderStatusColor(status: OrderStatus): string {
  return ORDER_STATUS_FLOW[status].color;
}

// Get order status label
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_FLOW[status].label;
}

// Check if order can be updated
export function canUpdateOrder(
  order: Order,
  newStatus: OrderStatus,
): {
  canUpdate: boolean;
  reason?: string;
} {
  const currentStatus = order.orderStatus as OrderStatus;
  const currentFlow = ORDER_STATUS_FLOW[currentStatus];

  if (currentStatus === "cancelled" || currentStatus === "delivered") {
    return {
      canUpdate: false,
      reason: `Order is ${currentFlow.label.toLowerCase()} and cannot be updated`,
    };
  }

  if (newStatus === currentStatus) {
    return {
      canUpdate: false,
      reason: "Order is already in this status",
    };
  }

  // Allow status updates in forward direction only
  let tempStatus: OrderStatus | null = currentStatus;
  while (tempStatus && tempStatus !== newStatus) {
    tempStatus = ORDER_STATUS_FLOW[tempStatus].next as OrderStatus;
    if (tempStatus === newStatus) {
      return { canUpdate: true };
    }
  }

  return {
    canUpdate: false,
    reason: "Invalid status transition",
  };
}

// Calculate order preparation time
export function estimateOrderPrepTime(items: OrderItem[]): {
  estimatedMinutes: number;
  timeRange: string;
} {
  // Base time: 10 minutes
  let baseMinutes = 10;

  // Add time based on item count
  baseMinutes += items.length * 2; // 2 minutes per item

  // Add time for complex items (customizations, special requests)
  const complexItems = items.filter((item) => item.variant).length;
  baseMinutes += complexItems * 3; // 3 extra minutes for variants

  // Add time for large quantities
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity > 10) {
    baseMinutes += 5; // Extra 5 minutes for bulk orders
  }

  const estimatedMinutes = Math.max(15, Math.round(baseMinutes)); // Minimum 15 minutes
  const buffer = Math.max(5, Math.round(estimatedMinutes * 0.2)); // 20% buffer

  return {
    estimatedMinutes,
    timeRange: `${Math.max(10, estimatedMinutes - buffer)}-${estimatedMinutes + buffer} mins`,
  };
}

// Generate order invoice
export function generateOrderInvoice(order: Order): string {
  const { items, summary, address, orderNumber, createdAt } = order;

  let invoice = `
ORDER INVOICE
=============
Order Number: ${orderNumber}
Date: ${createdAt.toLocaleDateString("en-IN")}
Time: ${createdAt.toLocaleTimeString("en-IN")}

Customer Details:
${address.fullName}
${address.phoneNumber}
${address.addressLine1}${address.addressLine2 ? ", " + address.addressLine2 : ""}
${address.city}, ${address.state} - ${address.pincode}
${address.landmark ? "Landmark: " + address.landmark : ""}

Items:
`;

  items.forEach((item, index) => {
    invoice += `${index + 1}. ${item.productName}${item.variant ? " (" + item.variant + ")" : ""}
    Quantity: ${item.quantity} x ₹${item.unitPrice.toFixed(2)} = ₹${item.totalPrice.toFixed(2)}
`;
  });

  invoice += `
Order Summary:
Subtotal: ₹${summary.subtotal.toFixed(2)}
Delivery Charge: ₹${summary.deliveryCharge.toFixed(2)}
Tax (GST 18%): ₹${summary.tax.toFixed(2)}
Discount: -₹${summary.discount.toFixed(2)}
Total: ₹${summary.total.toFixed(2)}

Payment Method: ${order.paymentMethod.toUpperCase()}
Payment Status: ${order.paymentStatus.toUpperCase()}

Thank you for shopping with TownKart!
=====================================
`;

  return invoice.trim();
}

// Filter orders based on criteria
export function filterOrders(orders: Order[], filters: OrderFilter): Order[] {
  return orders.filter((order) => {
    if (filters.status && order.orderStatus !== filters.status) {
      return false;
    }

    if (
      filters.paymentStatus &&
      order.paymentStatus !== filters.paymentStatus
    ) {
      return false;
    }

    if (filters.customerId && order.customerId !== filters.customerId) {
      return false;
    }

    if (filters.dateRange) {
      const orderDate = new Date(order.createdAt);
      if (
        orderDate < filters.dateRange.start ||
        orderDate > filters.dateRange.end
      ) {
        return false;
      }
    }

    if (filters.minAmount && order.summary.total < filters.minAmount) {
      return false;
    }

    if (filters.maxAmount && order.summary.total > filters.maxAmount) {
      return false;
    }

    return true;
  });
}

// Calculate order metrics
export function calculateOrderMetrics(orders: Order[]): {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusBreakdown: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
} {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.summary.total,
    0,
  );
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const statusBreakdown: Record<string, number> = {};
  const paymentMethodBreakdown: Record<string, number> = {};
  const productCount: Record<string, { name: string; quantity: number }> = {};

  orders.forEach((order) => {
    // Status breakdown
    statusBreakdown[order.orderStatus] =
      (statusBreakdown[order.orderStatus] || 0) + 1;

    // Payment method breakdown
    paymentMethodBreakdown[order.paymentMethod] =
      (paymentMethodBreakdown[order.paymentMethod] || 0) + 1;

    // Product count
    order.items.forEach((item) => {
      if (productCount[item.productId]) {
        productCount[item.productId].quantity += item.quantity;
      } else {
        productCount[item.productId] = {
          name: item.productName,
          quantity: item.quantity,
        };
      }
    });
  });

  const topProducts = Object.entries(productCount)
    .map(([productId, data]) => ({
      productId,
      productName: data.name,
      quantity: data.quantity,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  return {
    totalOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    statusBreakdown,
    paymentMethodBreakdown,
    topProducts,
  };
}
