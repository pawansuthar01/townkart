// Order Status Management System

import { prisma } from "./prisma";
import { notificationManager } from "./notificationSystem";

export type OrderStatus =
  | "pending" // ORDER_PLACED
  | "confirmed" // STORE_ASSIGNED
  | "preparing" // BEING_PREPARED
  | "ready_for_pickup" // READY_FOR_PICKUP
  | "picked_up" // RIDER_ASSIGNED
  | "in_transit" // EN_ROUTE
  | "delivered" // DELIVERED
  | "cancelled"
  | "refunded"
  | "failed";

export type OrderEventType =
  | "created"
  | "store_assigned" // New: Store assigned to order
  | "confirmed"
  | "payment_received"
  | "preparing_started"
  | "preparing_completed"
  | "ready_for_pickup"
  | "rider_assigned" // Updated: Rider assigned
  | "en_route" // New: Rider en route
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "refund_initiated"
  | "refund_completed"
  | "delivery_failed"
  | "status_updated";

export interface OrderStatusConfig {
  status: OrderStatus;
  label: string;
  description: string;
  color: string;
  icon: string;
  allowedTransitions: OrderStatus[];
  requiresAction: boolean;
  notifyCustomer: boolean;
  notifyMerchant: boolean;
  notifyRider: boolean;
  autoTransition?: {
    after: number; // minutes
    to: OrderStatus;
  };
}

export interface OrderEvent {
  id: string;
  orderId: string;
  type: OrderEventType;
  status: OrderStatus;
  previousStatus?: OrderStatus;
  timestamp: Date;
  actor: {
    id: string;
    type: "customer" | "merchant" | "rider" | "admin" | "system";
    name: string;
  };
  metadata?: Record<string, any>;
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface OrderStatusTransition {
  from: OrderStatus;
  to: OrderStatus;
  allowedActors: Array<"customer" | "merchant" | "rider" | "admin" | "system">;
  requiresApproval?: boolean;
  validationRules?: Array<{
    field: string;
    rule: string;
    message: string;
  }>;
  sideEffects?: Array<{
    action: string;
    params: Record<string, any>;
  }>;
}

// Order status configurations
export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    status: "pending",
    label: "Order Placed",
    description: "Order has been placed and store is being assigned",
    color: "bg-yellow-500",
    icon: "🕒",
    allowedTransitions: ["confirmed", "cancelled"],
    requiresAction: true,
    notifyCustomer: true,
    notifyMerchant: false, // Will be store
    notifyRider: false,
    autoTransition: {
      after: 1, // Quick assignment
      to: "confirmed",
    },
  },
  confirmed: {
    status: "confirmed",
    label: "Store Assigned",
    description: "Store has been assigned and order is being prepared",
    color: "bg-blue-500",
    icon: "🏪",
    allowedTransitions: ["preparing", "cancelled"],
    requiresAction: false,
    notifyCustomer: true,
    notifyMerchant: false, // Will be store
    notifyRider: false,
    autoTransition: {
      after: 2,
      to: "preparing",
    },
  },
  preparing: {
    status: "preparing",
    label: "Being Prepared",
    description: "Store is preparing your order",
    color: "bg-orange-500",
    icon: "👨‍🍳",
    allowedTransitions: ["ready_for_pickup", "cancelled"],
    requiresAction: false,
    notifyCustomer: false,
    notifyMerchant: false, // Will be store
    notifyRider: false,
  },
  ready_for_pickup: {
    status: "ready_for_pickup",
    label: "Ready for Pickup",
    description: "Order is ready and waiting for rider pickup",
    color: "bg-purple-500",
    icon: "📦",
    allowedTransitions: ["picked_up", "cancelled"],
    requiresAction: true,
    notifyCustomer: true,
    notifyMerchant: false,
    notifyRider: true,
  },
  picked_up: {
    status: "picked_up",
    label: "Rider Assigned",
    description: "Rider has been assigned and is heading to store",
    color: "bg-indigo-500",
    icon: "🚴",
    allowedTransitions: ["in_transit"],
    requiresAction: false,
    notifyCustomer: true,
    notifyMerchant: false, // Will be store
    notifyRider: false,
    autoTransition: {
      after: 1,
      to: "in_transit",
    },
  },
  in_transit: {
    status: "in_transit",
    label: "En Route",
    description: "Rider is en route to deliver your order",
    color: "bg-cyan-500",
    icon: "🚚",
    allowedTransitions: ["delivered", "failed"],
    requiresAction: false,
    notifyCustomer: false,
    notifyMerchant: false, // Will be store
    notifyRider: false,
  },
  delivered: {
    status: "delivered",
    label: "Delivered",
    description: "Order has been successfully delivered",
    color: "bg-green-500",
    icon: "🎉",
    allowedTransitions: [],
    requiresAction: false,
    notifyCustomer: true,
    notifyMerchant: true,
    notifyRider: true,
  },
  cancelled: {
    status: "cancelled",
    label: "Order Cancelled",
    description: "Order has been cancelled",
    color: "bg-red-500",
    icon: "❌",
    allowedTransitions: ["refunded"],
    requiresAction: false,
    notifyCustomer: true,
    notifyMerchant: true,
    notifyRider: true,
  },
  refunded: {
    status: "refunded",
    label: "Refund Processed",
    description: "Refund has been processed successfully",
    color: "bg-gray-500",
    icon: "💰",
    allowedTransitions: [],
    requiresAction: false,
    notifyCustomer: true,
    notifyMerchant: false,
    notifyRider: false,
  },
  failed: {
    status: "failed",
    label: "Delivery Failed",
    description: "Delivery attempt failed",
    color: "bg-red-600",
    icon: "⚠️",
    allowedTransitions: ["in_transit", "cancelled"],
    requiresAction: true,
    notifyCustomer: true,
    notifyMerchant: true,
    notifyRider: false,
  },
};

// Status transition rules
export const ORDER_TRANSITIONS: OrderStatusTransition[] = [
  {
    from: "pending",
    to: "confirmed",
    allowedActors: ["merchant", "admin", "system"],
    validationRules: [
      {
        field: "payment",
        rule: "completed",
        message: "Payment must be completed before confirming order",
      },
    ],
    sideEffects: [
      {
        action: "notify_customer",
        params: { template: "order_confirmed" },
      },
      {
        action: "notify_merchant",
        params: { template: "order_confirmed" },
      },
      {
        action: "notify_new_order",
        params: {},
      },
    ],
  },
  {
    from: "confirmed",
    to: "preparing",
    allowedActors: ["merchant", "admin", "system"],
    sideEffects: [
      {
        action: "update_inventory",
        params: { action: "reserve" },
      },
    ],
  },
  {
    from: "preparing",
    to: "ready_for_pickup",
    allowedActors: ["merchant", "admin"],
    sideEffects: [
      {
        action: "notify_customer",
        params: { template: "order_ready" },
      },
      {
        action: "notify_rider",
        params: { template: "order_ready" },
      },
      {
        action: "create_delivery",
        params: {},
      },
      {
        action: "send_delivery_offers",
        params: {},
      },
    ],
  },
  {
    from: "ready_for_pickup",
    to: "picked_up",
    allowedActors: ["rider", "admin"],
    validationRules: [
      {
        field: "rider_assigned",
        rule: "required",
        message: "Rider must be assigned before pickup",
      },
    ],
    sideEffects: [
      {
        action: "notify_customer",
        params: { template: "rider_assigned" },
      },
      {
        action: "notify_merchant",
        params: { template: "rider_assigned" },
      },
      {
        action: "start_delivery_tracking",
        params: {},
      },
    ],
  },
  {
    from: "picked_up",
    to: "in_transit",
    allowedActors: ["rider", "admin", "system"],
    sideEffects: [
      {
        action: "notify_customer",
        params: { template: "delivery_started" },
      },
      {
        action: "update_delivery_location",
        params: { track: true },
      },
    ],
  },
  {
    from: "in_transit",
    to: "delivered",
    allowedActors: ["rider", "customer", "admin"],
    validationRules: [
      {
        field: "otp_verified",
        rule: "required",
        message: "OTP verification required for delivery",
      },
    ],
    sideEffects: [
      {
        action: "notify_customer",
        params: { template: "order_delivered" },
      },
      {
        action: "notify_merchant",
        params: { template: "order_delivered" },
      },
      {
        action: "notify_rider",
        params: { template: "order_delivered" },
      },
      {
        action: "complete_order",
        params: {},
      },
      {
        action: "release_inventory",
        params: { action: "deduct" },
      },
      {
        action: "process_payment",
        params: { to: "merchant" },
      },
    ],
  },
  {
    from: "in_transit",
    to: "failed",
    allowedActors: ["rider", "admin"],
    sideEffects: [
      {
        action: "notify_customer",
        params: { template: "delivery_failed" },
      },
    ],
  },
  {
    from: "failed",
    to: "in_transit",
    allowedActors: ["rider", "admin"],
    sideEffects: [
      {
        action: "retry_delivery",
        params: {},
      },
    ],
  },
  {
    from: "pending",
    to: "cancelled",
    allowedActors: ["customer", "merchant", "admin"],
    validationRules: [
      {
        field: "cancellation_reason",
        rule: "required",
        message: "Cancellation reason is required",
      },
    ],
    sideEffects: [
      {
        action: "notify_customer",
        params: { template: "order_cancelled" },
      },
      {
        action: "notify_merchant",
        params: { template: "order_cancelled" },
      },
      {
        action: "notify_rider",
        params: { template: "order_cancelled" },
      },
      {
        action: "release_inventory",
        params: { action: "release" },
      },
      {
        action: "process_refund",
        params: { condition: "eligible" },
      },
    ],
  },
  {
    from: "cancelled",
    to: "refunded",
    allowedActors: ["admin", "system"],
    sideEffects: [
      {
        action: "complete_refund",
        params: {},
      },
    ],
  },
];

// Order Status Manager Class
export class OrderStatusManager {
  private orderEvents: Map<string, OrderEvent[]> = new Map();
  private autoTransitionTimers: Map<string, NodeJS.Timeout> = new Map();

  // Get current status configuration
  getStatusConfig(status: OrderStatus): OrderStatusConfig {
    return ORDER_STATUS_CONFIG[status];
  }

  // Get allowed transitions for a status
  getAllowedTransitions(status: OrderStatus): OrderStatus[] {
    return ORDER_STATUS_CONFIG[status].allowedTransitions;
  }

  // Validate status transition
  validateTransition(
    from: OrderStatus,
    to: OrderStatus,
    actor: OrderEvent["actor"],
    metadata?: Record<string, any>,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if transition is allowed
    const allowedTransitions = this.getAllowedTransitions(from);
    if (!allowedTransitions.includes(to)) {
      errors.push(`Transition from ${from} to ${to} is not allowed`);
      return { valid: false, errors };
    }

    // Find transition rules
    const transition = ORDER_TRANSITIONS.find(
      (t) => t.from === from && t.to === to,
    );
    if (!transition) {
      errors.push("No transition rules found");
      return { valid: false, errors };
    }

    // Check actor permissions
    if (!transition.allowedActors.includes(actor.type)) {
      errors.push(
        `Actor type ${actor.type} is not allowed to perform this transition`,
      );
      return { valid: false, errors };
    }

    // Validate rules
    if (transition.validationRules) {
      for (const rule of transition.validationRules) {
        const value = metadata?.[rule.field];
        if (rule.rule === "required" && !value) {
          errors.push(rule.message);
        } else if (rule.rule === "completed" && value !== "completed") {
          errors.push(rule.message);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Execute status transition
  async transitionStatus(
    orderId: string,
    newStatus: OrderStatus,
    actor: OrderEvent["actor"],
    metadata?: Record<string, any>,
    notes?: string,
  ): Promise<{ success: boolean; errors: string[]; event?: OrderEvent }> {
    // Get current status
    const events = this.orderEvents.get(orderId) || [];
    const currentStatus =
      events.length > 0 ? events[events.length - 1].status : "pending";

    // Validate transition
    const validation = this.validateTransition(
      currentStatus,
      newStatus,
      actor,
      metadata,
    );
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Create event
    const event: OrderEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      type: this.getEventTypeForTransition(currentStatus, newStatus),
      status: newStatus,
      previousStatus: currentStatus,
      timestamp: new Date(),
      actor,
      metadata,
      notes,
    };

    // Add event
    this.orderEvents.set(orderId, [...events, event]);

    // Execute side effects
    await this.executeSideEffects(orderId, currentStatus, newStatus, metadata);

    // Set up auto-transition if configured
    const config = ORDER_STATUS_CONFIG[newStatus];
    if (config.autoTransition) {
      this.scheduleAutoTransition(orderId, config.autoTransition);
    }

    // Clear any existing auto-transition for this order
    const existingTimer = this.autoTransitionTimers.get(orderId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.autoTransitionTimers.delete(orderId);
    }

    return { success: true, errors: [], event };
  }

  // Get order events
  getOrderEvents(orderId: string): OrderEvent[] {
    return this.orderEvents.get(orderId) || [];
  }

  // Get current status
  getCurrentStatus(orderId: string): OrderStatus {
    const events = this.orderEvents.get(orderId) || [];
    return events.length > 0 ? events[events.length - 1].status : "pending";
  }

  // Get order timeline
  getOrderTimeline(orderId: string): Array<{
    status: OrderStatus;
    timestamp: Date;
    actor: OrderEvent["actor"];
    notes?: string;
    duration?: number; // minutes from previous status
  }> {
    const events = this.getOrderEvents(orderId);
    return events.map((event, index) => {
      const prevEvent = index > 0 ? events[index - 1] : null;
      const duration = prevEvent
        ? Math.round(
            (event.timestamp.getTime() - prevEvent.timestamp.getTime()) /
              (1000 * 60),
          )
        : undefined;

      return {
        status: event.status,
        timestamp: event.timestamp,
        actor: event.actor,
        notes: event.notes,
        duration,
      };
    });
  }

  // Get status statistics
  getStatusStats(): Record<OrderStatus, number> {
    const stats: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready_for_pickup: 0,
      picked_up: 0,
      in_transit: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
      failed: 0,
    };

    for (const events of Array.from(this.orderEvents.values())) {
      if (events.length > 0) {
        const currentStatus = events[events.length - 1].status;
        stats[currentStatus as OrderStatus]++;
      }
    }

    return stats;
  }

  // Private methods
  private getEventTypeForTransition(
    from: OrderStatus,
    to: OrderStatus,
  ): OrderEventType {
    const mapping: Record<string, OrderEventType> = {
      "pending->confirmed": "store_assigned", // Store assigned
      "confirmed->preparing": "preparing_started",
      "preparing->ready_for_pickup": "preparing_completed",
      "ready_for_pickup->picked_up": "rider_assigned", // Rider assigned
      "picked_up->in_transit": "en_route", // En route
      "in_transit->delivered": "delivered",
      "pending->cancelled": "cancelled",
      "cancelled->refunded": "refund_completed",
      "in_transit->failed": "delivery_failed",
    };

    return mapping[`${from}->${to}`] || "status_updated";
  }

  private async executeSideEffects(
    orderId: string,
    from: OrderStatus,
    to: OrderStatus,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const transition = ORDER_TRANSITIONS.find(
      (t) => t.from === from && t.to === to,
    );
    if (!transition?.sideEffects) return;

    for (const effect of transition.sideEffects) {
      try {
        await this.executeSideEffect(orderId, effect, metadata);
      } catch (error) {
        console.error(`Failed to execute side effect ${effect.action}:`, error);
      }
    }
  }

  private async executeSideEffect(
    orderId: string,
    effect: NonNullable<OrderStatusTransition["sideEffects"]>[0],
    metadata?: Record<string, any>,
  ): Promise<void> {
    switch (effect.action) {
      case "notify_customer":
        await this.notifyCustomer(orderId, effect.params);
        break;
      case "notify_merchant":
        await this.notifyStoreManager(orderId, effect.params);
        break;
      case "notify_rider":
        await this.notifyRider(orderId, effect.params);
        break;
      case "notify_new_order":
        await this.notifyNewOrder(orderId, effect.params);
        break;
      case "send_delivery_offers":
        // New: Send delivery offers to available riders
        const { sendDeliveryOffersToRiders } = await import(
          "./deliveryAssignment"
        );
        await sendDeliveryOffersToRiders(orderId);
        break;
      case "create_delivery":
        await this.createDeliveryForOrder(orderId);
        break;
      case "assign_delivery":
        await this.assignDeliveryForOrder(orderId);
        break;
      case "update_inventory":
        console.log(`Updating inventory for order ${orderId}:`, effect.params);
        break;
      case "release_inventory":
        console.log(`Releasing inventory for order ${orderId}:`, effect.params);
        break;
      case "start_delivery_tracking":
        console.log(`Starting delivery tracking for order ${orderId}`);
        break;
      case "update_delivery_location":
        console.log(`Updating delivery location for order ${orderId}`);
        break;
      case "complete_order":
        // Process rider payment when delivery is completed
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          select: { delivery: { select: { id: true } } },
        });
        if (order?.delivery?.id) {
          const { processRiderPayment } = await import("./deliveryAssignment");
          await processRiderPayment(order.delivery.id);
        }
        console.log(`Completed order ${orderId} and processed rider payment`);
        break;
      case "process_payment":
        // Process payment to store wallet when order is delivered
        const { walletManager } = await import("./walletManagement");
        await walletManager.processOrderPayment(orderId);
        console.log(`Processed payment for order ${orderId}`);
        break;
      case "process_refund":
        console.log(`Processing refund for order ${orderId}:`, effect.params);
        break;
      case "complete_refund":
        console.log(`Completing refund for order ${orderId}`);
        break;
      case "retry_delivery":
        console.log(`Retrying delivery for order ${orderId}`);
        break;
      default:
        console.log(`Unknown side effect: ${effect.action}`);
    }
  }

  private async createDeliveryForOrder(orderId: string): Promise<void> {
    try {
      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          store: true,
          customer: true,
        },
      });

      if (!order) {
        console.error(`Order ${orderId} not found for delivery creation`);
        return;
      }

      // Check if delivery already exists
      const existingDelivery = await prisma.delivery.findUnique({
        where: { orderId },
      });

      if (existingDelivery) {
        console.log(`Delivery already exists for order ${orderId}`);
        return;
      }

      // Generate OTPs
      const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

      // Create delivery record
      const delivery = await prisma.delivery.create({
        data: {
          orderId,
          pickupOtp,
          deliveryOtp,
          deliveryStatus: "ASSIGNED",
          pickupLat: order.store.latitude || undefined,
          pickupLng: order.store.longitude || undefined,
          deliveryLat: (order.deliveryAddress as any)?.latitude || undefined,
          deliveryLng: (order.deliveryAddress as any)?.longitude || undefined,
          deliveryFee: order.deliveryFee,
        },
      });

      console.log(`Created delivery ${delivery.id} for order ${orderId}`);

      // Trigger delivery assignment
      await this.assignDeliveryForOrder(orderId);
    } catch (error) {
      console.error(`Failed to create delivery for order ${orderId}:`, error);
    }
  }

  private async assignDeliveryForOrder(orderId: string): Promise<void> {
    try {
      // Import delivery assignment logic
      const { assignDeliveryToOrder } = await import("./deliveryAssignment");
      await assignDeliveryToOrder(orderId);
    } catch (error) {
      console.error(`Failed to assign delivery for order ${orderId}:`, error);
    }
  }

  private async notifyCustomer(orderId: string, params: any): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          store: true,
          customer: true,
        },
      });

      if (!order) return;

      await notificationManager.broadcastNotification(
        [
          {
            userId: order.customerId,
            userType: "customer",
          },
        ],
        "order_status_update",
        {
          title: `Order Update: ${order.orderNumber}`,
          message: `Your order status has been updated to ${getStatusLabel(this.getCurrentStatus(orderId))}`,
          orderId,
          orderNumber: order.orderNumber,
          storeName: order.store.name,
          status: this.getCurrentStatus(orderId),
        },
        ["in_app", "push"],
      );
    } catch (error) {
      console.error(`Failed to notify customer for order ${orderId}:`, error);
    }
  }

  private async notifyStoreManager(
    orderId: string,
    params: any,
  ): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          store: {
            include: {
              staff: {
                include: {
                  user: true,
                },
              },
            },
          },
          customer: true,
          orderItems: true,
        },
      });

      if (!order) return;

      // Notify all store staff
      const storeStaff = order.store.staff.map((staff) => ({
        userId: staff.userId,
        userType: "store_manager" as const,
      }));

      if (storeStaff.length > 0) {
        await notificationManager.broadcastNotification(
          storeStaff,
          "order_status_update",
          {
            title: `Order Update: ${order.orderNumber}`,
            message: `Order ${order.orderNumber} status updated to ${getStatusLabel(this.getCurrentStatus(orderId))}`,
            orderId,
            orderNumber: order.orderNumber,
            customerName: order.customer.fullName,
            status: this.getCurrentStatus(orderId),
          },
          ["in_app", "push"],
        );
      }
    } catch (error) {
      console.error(
        `Failed to notify store manager for order ${orderId}:`,
        error,
      );
    }
  }

  private async notifyRider(orderId: string, params: any): Promise<void> {
    try {
      const delivery = await prisma.delivery.findUnique({
        where: { orderId },
        include: {
          rider: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!delivery?.rider) return;

      await notificationManager.broadcastNotification(
        [
          {
            userId: delivery.rider.userId,
            userType: "rider",
          },
        ],
        "order_status_update",
        {
          title: `Delivery Update`,
          message: `Order ${orderId} status updated - please check your delivery`,
          orderId,
          deliveryId: delivery.id,
          status: this.getCurrentStatus(orderId),
        },
        ["in_app", "push"],
      );
    } catch (error) {
      console.error(`Failed to notify rider for order ${orderId}:`, error);
    }
  }

  private async notifyNewOrder(orderId: string, params: any): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          store: {
            include: {
              staff: {
                include: {
                  user: true,
                },
              },
            },
          },
          customer: true,
        },
      });

      if (!order) return;

      // Notify store staff about new order
      const storeStaff = order.store.staff.map((staff) => ({
        userId: staff.userId,
        userType: "store_manager" as const,
      }));

      if (storeStaff.length > 0) {
        await notificationManager.broadcastNotification(
          storeStaff,
          "order_status_update",
          {
            title: `New Order: ${order.orderNumber}`,
            message: `New order received from ${order.customer.fullName} for ₹${order.finalAmount}`,
            orderId,
            orderNumber: order.orderNumber,
            customerName: order.customer.fullName,
            customerPhone: order.customer.phoneNumber,
            amount: order.finalAmount,
            items: 0, // Will be calculated separately if needed
          },
          ["in_app", "push"],
        );
      }
    } catch (error) {
      console.error(`Failed to notify new order for ${orderId}:`, error);
    }
  }

  private async notifyRidersForOrder(orderId: string): Promise<void> {
    try {
      // This would notify available riders about the new order
      console.log(`Notifying riders about order ${orderId} ready for pickup`);
      // Implementation would involve sending push notifications or updating rider apps
    } catch (error) {
      console.error(`Failed to notify riders for order ${orderId}:`, error);
    }
  }

  private scheduleAutoTransition(
    orderId: string,
    config: OrderStatusConfig["autoTransition"],
  ): void {
    if (!config) return;

    const timer = setTimeout(
      async () => {
        const currentStatus = this.getCurrentStatus(orderId);
        if (currentStatus === config.to) return; // Already transitioned

        await this.transitionStatus(
          orderId,
          config.to,
          {
            id: "system",
            type: "system",
            name: "System",
          },
          {},
          `Auto-transitioned after ${config.after} minutes`,
        );
      },
      config.after * 60 * 1000,
    );

    this.autoTransitionTimers.set(orderId, timer);
  }

  // Cleanup method
  destroy(): void {
    for (const timer of Array.from(this.autoTransitionTimers.values())) {
      clearTimeout(timer);
    }
    this.autoTransitionTimers.clear();
    this.orderEvents.clear();
  }
}

// Export singleton instance
export const orderStatusManager = new OrderStatusManager();

// Utility functions
export function getStatusColor(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status].color;
}

export function getStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status].label;
}

export function getStatusIcon(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status].icon;
}

export function getStatusDescription(status: OrderStatus): string {
  return ORDER_STATUS_CONFIG[status].description;
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return ["delivered", "cancelled", "refunded"].includes(status);
}

export function canCancelOrder(status: OrderStatus): boolean {
  return ["pending", "confirmed", "preparing", "ready_for_pickup"].includes(
    status,
  );
}

export function requiresAction(status: OrderStatus): boolean {
  return ORDER_STATUS_CONFIG[status].requiresAction;
}
