// Real-Time Notification System
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export type NotificationType =
  | "order_status_update"
  | "delivery_assigned"
  | "delivery_started"
  | "delivery_completed"
  | "payment_received"
  | "payment_failed"
  | "rider_location_update"
  | "rider_location_alert"
  | "rider_delivery_offer" // New: Delivery offer for riders
  | "merchant_order_ready"
  | "customer_support"
  | "promotional"
  | "system_alert"
  | "admin_manual" // Manual notifications from admin
  | "store_manual" // Manual notifications from store
  | "invitation"; // User invitations

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type NotificationChannel =
  | "in_app"
  | "push"
  | "sms"
  | "email"
  | "whatsapp";

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  variables: string[]; // Template variables like {{orderId}}, {{customerName}}
  actions?: Array<{
    label: string;
    action: string;
    params: Record<string, any>;
  }>;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  data?: Record<string, any>; // Additional context data
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  actions?: Array<{
    label: string;
    action: string;
    params: Record<string, any>;
  }>;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  userType: "customer" | "store_manager" | "rider" | "admin";
  types: NotificationType[];
  channels: NotificationChannel[];
  preferences: {
    quietHours?: { start: string; end: string };
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    showPreview: boolean;
  };
  deviceTokens?: {
    fcm?: string; // Firebase Cloud Messaging
    apns?: string; // Apple Push Notification Service
    web?: string; // Web Push
  };
}

export interface NotificationEvent {
  id: string;
  type: NotificationType;
  recipients: Array<{
    userId: string;
    userType: "customer" | "store_manager" | "rider" | "admin";
    channels: NotificationChannel[];
  }>;
  data: Record<string, any>;
  priority: NotificationPriority;
  scheduledFor?: Date;
  createdAt: Date;
}

// Notification Templates
export const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  NotificationTemplate
> = {
  rider_location_alert: {
    id: "rider_location_alert",
    type: "rider_location_alert",
    title: "Rider Location alert",
    message: "{{riderName}} is {{distance}} away from your location",
    priority: "high",
    channels: ["in_app", "email", "push", "whatsapp"],
    variables: ["riderName", "distance", "eta"],
  },
  order_status_update: {
    id: "order_status_update",
    type: "order_status_update",
    title: "Order Status Update",
    message: "Your order {{orderId}} status has been updated to {{status}}",
    priority: "medium",
    channels: ["in_app", "push"],
    variables: ["orderId", "status", "customerName"],
    actions: [
      {
        label: "View Order",
        action: "navigate",
        params: { route: "/orders/{{orderId}}" },
      },
    ],
  },
  delivery_assigned: {
    id: "delivery_assigned",
    type: "delivery_assigned",
    title: "Delivery Assigned",
    message:
      "{{riderName}} has been assigned to deliver your order {{orderId}}",
    priority: "high",
    channels: ["in_app", "push", "sms"],
    variables: ["orderId", "riderName", "riderPhone", "estimatedTime"],
    actions: [
      {
        label: "Call Rider",
        action: "call",
        params: { phone: "{{riderPhone}}" },
      },
      {
        label: "Track Delivery",
        action: "navigate",
        params: { route: "/orders/{{orderId}}/track" },
      },
    ],
  },
  delivery_started: {
    id: "delivery_started",
    type: "delivery_started",
    title: "Delivery Started",
    message: "Your order {{orderId}} is now out for delivery",
    priority: "high",
    channels: ["in_app", "push"],
    variables: ["orderId", "riderName", "estimatedTime"],
    actions: [
      {
        label: "Track Live",
        action: "navigate",
        params: { route: "/orders/{{orderId}}/track" },
      },
    ],
  },
  delivery_completed: {
    id: "delivery_completed",
    type: "delivery_completed",
    title: "Order Delivered",
    message: "Your order {{orderId}} has been successfully delivered!",
    priority: "high",
    channels: ["in_app", "push", "sms"],
    variables: ["orderId", "deliveredAt"],
    actions: [
      {
        label: "Rate Delivery",
        action: "navigate",
        params: { route: "/orders/{{orderId}}/review" },
      },
    ],
  },
  payment_received: {
    id: "payment_received",
    type: "payment_received",
    title: "Payment Received",
    message: "Payment of ₹{{amount}} received for order {{orderId}}",
    priority: "medium",
    channels: ["in_app"],
    variables: ["orderId", "amount", "paymentMethod"],
  },
  payment_failed: {
    id: "payment_failed",
    type: "payment_failed",
    title: "Payment Failed",
    message: "Payment for order {{orderId}} could not be processed",
    priority: "urgent",
    channels: ["in_app", "push", "sms"],
    variables: ["orderId", "amount", "reason"],
    actions: [
      {
        label: "Retry Payment",
        action: "navigate",
        params: { route: "/orders/{{orderId}}/payment" },
      },
    ],
  },
  rider_location_update: {
    id: "rider_location_update",
    type: "rider_location_update",
    title: "Rider Location Update",
    message: "{{riderName}} is {{distance}} away from your location",
    priority: "low",
    channels: ["in_app"],
    variables: ["riderName", "distance", "eta"],
  },
  rider_delivery_offer: {
    id: "rider_delivery_offer",
    type: "rider_delivery_offer",
    title: "New Delivery Available",
    message:
      "New delivery: {{orderId}} from {{storeName}} to {{customerAddress}}. Distance: {{distance}}km, Earnings: ₹{{earnings}}",
    priority: "urgent",
    channels: ["in_app", "push"],
    variables: [
      "orderId",
      "storeName",
      "customerAddress",
      "distance",
      "earnings",
      "pickupTime",
    ],
    actions: [
      {
        label: "Accept Delivery",
        action: "api_call",
        params: {
          method: "POST",
          url: "/api/deliveries/accept",
          body: { orderId: "{{orderId}}" },
        },
      },
      {
        label: "Reject",
        action: "api_call",
        params: {
          method: "POST",
          url: "/api/deliveries/reject",
          body: { orderId: "{{orderId}}" },
        },
      },
    ],
  },
  merchant_order_ready: {
    id: "merchant_order_ready",
    type: "merchant_order_ready",
    title: "Order Ready",
    message: "Order {{orderId}} is ready for pickup",
    priority: "high",
    channels: ["in_app", "push"],
    variables: ["orderId", "customerName", "items"],
  },
  customer_support: {
    id: "customer_support",
    type: "customer_support",
    title: "Customer Support",
    message: "{{message}}",
    priority: "high",
    channels: ["in_app", "push"],
    variables: ["message", "supportId"],
    actions: [
      {
        label: "Contact Support",
        action: "navigate",
        params: { route: "/support" },
      },
    ],
  },
  promotional: {
    id: "promotional",
    type: "promotional",
    title: "{{title}}",
    message: "{{message}}",
    priority: "low",
    channels: ["in_app", "push"],
    variables: ["title", "message", "offerId"],
    actions: [
      {
        label: "View Offer",
        action: "navigate",
        params: { route: "/offers/{{offerId}}" },
      },
    ],
  },
  system_alert: {
    id: "system_alert",
    type: "system_alert",
    title: "System Alert",
    message: "{{message}}",
    priority: "urgent",
    channels: ["in_app", "push", "email"],
    variables: ["message", "alertType"],
  },
  admin_manual: {
    id: "admin_manual",
    type: "admin_manual",
    title: "{{title}}",
    message: "{{message}}",
    priority: "medium",
    channels: ["in_app", "push"],
    variables: ["title", "message", "sentBy"],
    actions: [], // Will be set dynamically
  },
  store_manual: {
    id: "store_manual",
    type: "store_manual",
    title: "{{title}}",
    message: "{{message}}",
    priority: "medium",
    channels: ["in_app", "push"],
    variables: ["title", "message", "storeName", "sentBy"],
    actions: [], // Will be set dynamically
  },
  invitation: {
    id: "invitation",
    type: "invitation",
    title: "You're Invited to Join TownKart",
    message:
      "You've been invited to join TownKart as a {{role}}. Click here to complete your registration.",
    priority: "high",
    channels: ["email"], // Primarily email for invitations
    variables: ["role", "invitationUrl", "expiresAt", "message"],
    actions: [
      {
        label: "Accept Invitation",
        action: "navigate",
        params: { route: "{{invitationUrl}}" },
      },
    ],
  },
};

// Notification Manager Class
export class NotificationManager {
  private notifications: Map<string, Notification[]> = new Map();
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private eventListeners: Map<
    string,
    Array<(event: NotificationEvent) => void>
  > = new Map();

  // Send notification
  async sendNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, any>,
    channels?: NotificationChannel[]
  ): Promise<{ success: boolean; notificationId?: string; errors?: string[] }> {
    try {
      const subscription = this.subscriptions.get(userId);
      if (!subscription) {
        return {
          success: false,
          errors: ["User not subscribed to notifications"],
        };
      }

      // Check if user wants this type of notification
      if (!subscription.types.includes(type)) {
        return {
          success: false,
          errors: ["User has disabled this notification type"],
        };
      }

      // Check admin settings for notification type
      const adminSettings = await this.getAdminNotificationSettings(type);
      if (!adminSettings.enabled) {
        return {
          success: false,
          errors: ["Notification type disabled by admin"],
        };
      }

      // Check quiet hours
      if (this.isQuietHour(subscription)) {
        return {
          success: false,
          errors: ["Notification blocked by quiet hours"],
        };
      }

      // Get template
      const template = NOTIFICATION_TEMPLATES[type];
      if (!template) {
        return { success: false, errors: ["Notification template not found"] };
      }

      // Interpolate template
      const title = this.interpolate(template.title, data);
      const message = this.interpolate(template.message, data);
      const actions = template.actions?.map((action) => ({
        ...action,
        params: this.interpolateObject(action.params, data),
      }));

      // Filter channels based on admin settings
      let allowedChannels = channels || subscription.channels;
      allowedChannels = allowedChannels.filter(
        (channel) => adminSettings.channels[channel]
      );

      // Create notification
      const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        type,
        title,
        message,
        priority: template.priority,
        channels: allowedChannels,
        data,
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        actions,
      };

      // Store notification
      const userNotifications = this.notifications.get(userId) || [];
      this.notifications.set(userId, [notification, ...userNotifications]);

      // Send through channels
      const sendResults = await this.sendThroughChannels(
        notification,
        subscription
      );

      // Emit event for real-time updates
      this.emitEvent({
        id: `event_${Date.now()}`,
        type,
        recipients: [
          {
            userId,
            userType: subscription.userType,
            channels: notification.channels,
          },
        ],
        data,
        priority: template.priority,
        createdAt: new Date(),
      });

      return {
        success: true,
        notificationId: notification.id,
        errors: sendResults
          .filter((r) => !r.success)
          .map((r) => r.error || "Unknown error"),
      };
    } catch (error) {
      console.error("Error sending notification:", error);
      return { success: false, errors: ["Internal error"] };
    }
  }

  // Send external email (for invitations, etc.) using Resend
  async sendExternalEmail(
    email: string,
    subject: string,
    message: string,
    html?: string,
    actions?: Array<{ label: string; url: string }>
  ): Promise<boolean> {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      const htmlContent =
        html ||
        `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TownKart</h1>
              <p style="color: #e8e8e8; margin: 10px 0 0 0;">Your trusted delivery partner</p>
            </div>

            <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333; margin-top: 0; margin-bottom: 20px;">${subject}</h2>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">${message}</p>

              ${
                actions
                  ?.map(
                    (action) => `
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${action.url}"
                     style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); transition: all 0.3s ease;">
                    ${action.label}
                  </a>
                </div>
              `
                  )
                  .join("") || ""
              }

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                <p>If you have any questions, feel free to contact our support team.</p>
                <p style="margin: 5px 0;">
                  <a href="mailto:support@townkart.com" style="color: #667eea; text-decoration: none;">support@townkart.com</a>
                </p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© 2024 TownKart. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;

      const data = await resend.emails.send({
        from: "TownKart <noreply@townkart.com>",
        to: [email],
        subject: subject,
        html: htmlContent,
        text: `${subject}\n\n${message}`,
      });

      console.log("Email sent successfully:", data);
      return true;
    } catch (error) {
      console.error("Failed to send external email:", error);
      return false;
    }
  }

  // Broadcast notification to multiple users
  async broadcastNotification(
    recipients: Array<{
      userId: string;
      userType: "customer" | "store_manager" | "rider" | "admin";
    }>,
    type: NotificationType,
    data: Record<string, any>,
    channels?: NotificationChannel[]
  ): Promise<{
    success: boolean;
    results: Array<{ userId: string; success: boolean; error?: string }>;
  }> {
    const results = await Promise.all(
      recipients.map(async (recipient) => {
        const result = await this.sendNotification(
          recipient.userId,
          type,
          data,
          channels
        );
        return {
          userId: recipient.userId,
          success: result.success,
          error: result.errors?.[0],
        };
      })
    );

    return {
      success: results.every((r) => r.success),
      results,
    };
  }

  // Get user notifications
  getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      type?: NotificationType;
      limit?: number;
      offset?: number;
    } = {}
  ): Notification[] {
    const userNotifications = this.notifications.get(userId) || [];

    let filtered = userNotifications;

    if (options.unreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    if (options.type) {
      filtered = filtered.filter((n) => n.type === options.type);
    }

    // Remove expired notifications
    filtered = filtered.filter((n) => !n.expiresAt || n.expiresAt > new Date());

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    if (options.offset) {
      filtered = filtered.slice(options.offset);
    }
    if (options.limit) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered;
  }

  // Mark notification as read
  markAsRead(userId: string, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;

    const notification = userNotifications.find((n) => n.id === notificationId);
    if (!notification) return false;

    notification.read = true;
    notification.readAt = new Date();
    return true;
  }

  // Mark all notifications as read
  markAllAsRead(userId: string): number {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return 0;

    let count = 0;
    userNotifications.forEach((notification) => {
      if (!notification.read) {
        notification.read = true;
        notification.readAt = new Date();
        count++;
      }
    });

    return count;
  }

  // Subscribe user to notifications
  subscribeUser(subscription: NotificationSubscription): void {
    this.subscriptions.set(subscription.userId, subscription);
  }

  // Unsubscribe user
  unsubscribeUser(userId: string): void {
    this.subscriptions.delete(userId);
  }

  // Update subscription preferences
  updateSubscription(
    userId: string,
    updates: Partial<NotificationSubscription>
  ): boolean {
    const subscription = this.subscriptions.get(userId);
    if (!subscription) return false;

    Object.assign(subscription, updates);
    return true;
  }

  // Get admin notification settings for a type
  private async getAdminNotificationSettings(type: NotificationType): Promise<{
    enabled: boolean;
    channels: Record<NotificationChannel, boolean>;
  }> {
    try {
      // Fetch from database
      const setting = await prisma.systemSetting.findUnique({
        where: {
          category_key: {
            category: "notifications",
            key: type,
          },
        },
      });

      if (setting) {
        const data = JSON.parse(setting.value);
        return {
          enabled: data.enabled !== false, // Default to true if not set
          channels: data.channels || {},
        };
      }

      // Fallback to template defaults
      const template = NOTIFICATION_TEMPLATES[type];
      if (!template) {
        return {
          enabled: false,
          channels: {} as Record<NotificationChannel, boolean>,
        };
      }

      // Return template channels as enabled by default
      const channels: Record<NotificationChannel, boolean> = {} as Record<
        NotificationChannel,
        boolean
      >;
      template.channels.forEach((channel) => {
        channels[channel] = true;
      });

      return { enabled: true, channels };
    } catch (error) {
      console.error("Error fetching admin notification settings:", error);
      return {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: false,
          whatsapp: false,
        },
      };
    }
  }

  // Get notification statistics
  getNotificationStats(userId?: string): {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  } {
    let notifications: Notification[] = [];

    if (userId) {
      notifications = this.notifications.get(userId) || [];
    } else {
      // Get all notifications
      const allNotifications: Notification[] = [];
      for (const userNotifs of Array.from(this.notifications.values())) {
        allNotifications.push(...userNotifs);
      }
      notifications = allNotifications;
    }

    const stats = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
    };

    notifications.forEach((notification) => {
      stats.byType[notification.type] =
        (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] =
        (stats.byPriority[notification.priority] || 0) + 1;
    });

    return stats;
  }

  // Event system for real-time updates
  on(eventType: string, listener: (event: NotificationEvent) => void): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.push(listener);
    this.eventListeners.set(eventType, listeners);
  }

  off(eventType: string, listener: (event: NotificationEvent) => void): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
      this.eventListeners.set(eventType, listeners);
    }
  }

  private emitEvent(event: NotificationEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in notification event listener:", error);
      }
    });

    // Broadcast via WebSocket if available
    if (wsServer) {
      event.recipients.forEach((recipient) => {
        const message = {
          type: "notification",
          notificationType: event.type,
          data: event.data,
          priority: event.priority,
          timestamp: event.createdAt,
        };

        // Broadcast to user
        wsServer.broadcastToUser(recipient.userId, message);

        // Additional broadcasting based on recipient type
        if (recipient.userType === "store_manager" && event.data.storeId) {
          wsServer.broadcastToStore(event.data.storeId, message);
        } else if (recipient.userType === "rider") {
          wsServer.broadcastToRider(recipient.userId, message);
        }
      });
    }
  }

  // Private methods
  private async sendThroughChannels(
    notification: Notification,
    subscription: NotificationSubscription
  ): Promise<
    Array<{ channel: NotificationChannel; success: boolean; error?: string }>
  > {
    const results: Array<{
      channel: NotificationChannel;
      success: boolean;
      error?: string;
    }> = [];

    for (const channel of notification.channels) {
      if (!subscription.channels.includes(channel)) continue;

      try {
        switch (channel) {
          case "in_app":
            // Already stored, no additional action needed
            results.push({ channel, success: true });
            break;

          case "push":
            await this.sendPushNotification(notification, subscription);
            results.push({ channel, success: true });
            break;

          case "sms":
            await this.sendSMS(notification);
            results.push({ channel, success: true });
            break;

          case "email":
            await this.sendEmail(notification);
            results.push({ channel, success: true });
            break;

          case "whatsapp":
            await this.sendWhatsApp(notification);
            results.push({ channel, success: true });
            break;
        }
      } catch (error: any) {
        console.error(`Failed to send ${channel} notification:`, error);
        results.push({ channel, success: false, error: error.message });
      }
    }

    return results;
  }

  private async sendPushNotification(
    notification: Notification,
    subscription: NotificationSubscription
  ): Promise<void> {
    // Implement push notification sending (Firebase, etc.)
    console.log("Sending push notification:", notification.title);
    // This would integrate with FCM/APNS
  }

  private async sendEmail(notification: Notification): Promise<void> {
    console.log("Sending email:", notification.title);

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Find user email from notification data or userId
      let recipientEmail: string;
      if (notification.data?.email) {
        // External email (for invitations)
        recipientEmail = notification.data.email;
      } else {
        // Registered user
        const user = await prisma.user.findUnique({
          where: { id: notification.userId },
          select: { email: true },
        });
        if (!user?.email) {
          throw new Error("User email not found");
        }
        recipientEmail = user.email;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${notification.title}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">TownKart</h1>
              <p style="color: #e8e8e8; margin: 10px 0 0 0;">Your trusted delivery partner</p>
            </div>

            <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333; margin-top: 0; margin-bottom: 20px;">${notification.title}</h2>
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">${notification.message}</p>

              ${
                notification.actions
                  ?.map(
                    (action) => `
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${action.params?.url || "#"}"
                     style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2); transition: all 0.3s ease;">
                    ${action.label}
                  </a>
                </div>
              `
                  )
                  .join("") || ""
              }

              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
                <p>If you have any questions, feel free to contact our support team.</p>
                <p style="margin: 5px 0;">
                  <a href="mailto:support@townkart.com" style="color: #667eea; text-decoration: none;">support@townkart.com</a>
                </p>
              </div>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© 2024 TownKart. All rights reserved.</p>
            </div>
          </body>
        </html>
      `;

      const data = await resend.emails.send({
        from: "TownKart <noreply@townkart.com>",
        to: [recipientEmail],
        subject: notification.title,
        html: htmlContent,
        text: `${notification.title}\n\n${notification.message}`,
      });

      console.log("Email sent successfully:", data);
    } catch (error) {
      console.error("Failed to send email:", error);
      throw error;
    }
  }

  private async sendSMS(notification: Notification): Promise<void> {
    console.log("Sending SMS:", notification.title);

    try {
      const apiKey = process.env.MSG91_API_KEY;
      const senderId = process.env.MSG91_SENDER_ID || "TOWNKT";
      const route = process.env.MSG91_ROUTE || "4";

      if (!apiKey) {
        console.log(`[MOCK SMS] Message: ${notification.message}`);
        console.log(
          `[MOCK SMS] Please configure MSG91_API_KEY in your .env file`
        );
        return;
      }

      // Find user phone number
      let recipientPhone: string;
      if (notification.data?.phone) {
        // External phone (for invitations)
        recipientPhone = notification.data.phone;
      } else {
        // Registered user
        const user = await prisma.user.findUnique({
          where: { id: notification.userId },
          select: { phoneNumber: true },
        });
        if (!user?.phoneNumber) {
          throw new Error("User phone number not found");
        }
        recipientPhone = user.phoneNumber;
      }

      // Clean phone number (remove +91 if present, MSG91 expects 10 digit number)
      const cleanPhone = recipientPhone.replace(/^\+91/, "").replace(/\D/g, "");

      if (cleanPhone.length !== 10) {
        throw new Error("Invalid phone number format");
      }

      // Create SMS message
      const smsMessage = `${notification.title}: ${notification.message}`;

      // MSG91 API call with DLT template support
      const dltTemplateId = process.env.MSG91_DLT_TEMPLATE_ID;
      const smsData: any = {
        sender: senderId,
        route: route,
        country: "91",
        sms: [
          {
            message: smsMessage,
            to: [cleanPhone],
          },
        ],
      };

      // Add DLT template ID if available (required for Indian SMS)
      if (dltTemplateId) {
        smsData.sms[0].DLT_TE_ID = dltTemplateId;
      }

      const response = await fetch(`https://api.msg91.com/api/v2/sendsms`, {
        method: "POST",
        headers: {
          authkey: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(smsData),
      });

      const result = await response.json();

      if (!response.ok || result.type !== "success") {
        throw new Error(result.message || "Failed to send SMS");
      }

      console.log(`SMS sent successfully via MSG91: ${result.message}`);
    } catch (error) {
      console.error("Failed to send SMS:", error);
      throw error;
    }
  }

  private async sendWhatsApp(notification: Notification): Promise<void> {
    // Implement WhatsApp sending (Twilio, etc.)
    console.log("Sending WhatsApp:", notification.message);
    // This would integrate with WhatsApp API
  }

  private interpolate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  private interpolateObject(
    obj: Record<string, any>,
    data: Record<string, any>
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        result[key] = this.interpolate(value, data);
      } else if (typeof value === "object" && value !== null) {
        result[key] = this.interpolateObject(value, data);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  private isQuietHour(subscription: NotificationSubscription): boolean {
    if (!subscription.preferences.quietHours) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime = this.parseTime(subscription.preferences.quietHours.start);
    const endTime = this.parseTime(subscription.preferences.quietHours.end);

    if (startTime < endTime) {
      // Same day range
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 100 + minutes;
  }

  // Cleanup method
  destroy(): void {
    this.notifications.clear();
    this.subscriptions.clear();
    this.eventListeners.clear();
  }
}

// WebSocket integration
let wsServer: any = null;

export function setWebSocketServer(server: any) {
  wsServer = server;
}

// Export singleton instance
export const notificationManager = new NotificationManager();

// Alias for backward compatibility
export const notificationService = notificationManager;

// Utility functions
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    order_status_update: "📦",
    delivery_assigned: "🚴",
    delivery_started: "🚚",
    delivery_completed: "✅",
    payment_received: "💰",
    payment_failed: "❌",
    rider_location_update: "📍",
    rider_delivery_offer: "🚴‍♂️",
    merchant_order_ready: "👨‍🍳",
    customer_support: "💬",
    promotional: "🎉",
    system_alert: "⚠️",
    rider_location_alert: "⚠️",
    admin_manual: "📢",
    store_manual: "🏪",
    invitation: "📨",
  };
  return icons[type] || "🔔";
}

export function getNotificationColor(priority: NotificationPriority): string {
  const colors: Record<NotificationPriority, string> = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };
  return colors[priority];
}

export function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
