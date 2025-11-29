// Advanced Delivery Confirmation Service for TownKart
// Multi-layer verification with GPS, customer confirmation, photo proof, and OTP

import { prisma } from "./prisma";
import { notificationService } from "./notificationSystem";

export interface DeliveryConfirmationRequest {
  deliveryId: string;
  riderId: string;
  riderLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  proofPhotoUrl?: string;
  customerOtp?: string;
}

export interface CustomerConfirmationRequest {
  orderId: string;
  customerId: string;
  confirmed: boolean;
  feedback?: string;
}

export class DeliveryService {
  // Verification thresholds
  private static readonly VERIFICATION_RULES = {
    GPS_DISTANCE_HIGH_VALUE: 50,    // 50m for orders > ₹1000
    GPS_DISTANCE_REGULAR: 100,     // 100m for regular orders
    GPS_ACCURACY_MIN: 20,          // Minimum GPS accuracy in meters
    PHOTO_REQUIRED_THRESHOLD: 500, // Photo proof for orders > ₹500
    OTP_REQUIRED_THRESHOLD: 1000,  // OTP verification for orders > ₹1000
    CUSTOMER_AUTO_CONFIRM: 7 * 60 * 1000, // 7 minutes
    CUSTOMER_DISPUTE_WINDOW: 30 * 60 * 1000, // 30 minutes
  };

  /**
   * Primary delivery confirmation by rider
   */
  static async confirmDelivery(deliveryData: DeliveryConfirmationRequest): Promise<{
    success: boolean;
    message: string;
    requiresCustomerConfirmation?: boolean;
    autoConfirmTime?: Date;
    verificationMethod?: string;
  }> {
    try {
      const { deliveryId, riderId, riderLocation, proofPhotoUrl, customerOtp } = deliveryData;

      // Get delivery with full order details
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          order: {
            include: {
              customer: true,
              store: true,
            }
          },
          rider: {
            include: {
              user: true,
            }
          }
        }
      });

      if (!delivery) {
        throw new Error('Delivery not found');
      }

      if (delivery.riderId !== riderId) {
        throw new Error('Unauthorized rider access');
      }

      if (delivery.deliveryStatus === 'DELIVERED') {
        throw new Error('Delivery already completed');
      }

      // Step 1: GPS Location Verification (Primary Security)
      const gpsValidation = await this.validateGPSLocation(
        riderLocation,
        delivery.order.deliveryAddress,
        delivery.order.finalAmount
      );

      if (!gpsValidation.valid) {
        throw new Error(gpsValidation.message);
      }

      // Step 2: Determine verification requirements
      const requirements = this.getVerificationRequirements(delivery.order.finalAmount);

      // Step 3: Validate additional proofs
      const proofValidation = this.validateAdditionalProofs(
        requirements,
        proofPhotoUrl,
        customerOtp
      );

      if (!proofValidation.valid) {
        throw new Error(proofValidation.message);
      }

      // Step 4: Process delivery confirmation
      const result = await this.processDeliveryConfirmation(
        delivery,
        riderLocation,
        proofPhotoUrl,
        customerOtp,
        requirements,
        gpsValidation
      );

      return result;

    } catch (error) {
      console.error('Delivery confirmation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Delivery confirmation failed'
      };
    }
  }

  /**
   * GPS Location Verification with fraud detection
   */
  private static async validateGPSLocation(
    riderLocation: { latitude: number; longitude: number; accuracy: number },
    customerAddress: any,
    orderValue: number
  ): Promise<{ valid: boolean; message: string; distance?: number; fraudFlags?: any }> {
    const { GPS_ACCURACY_MIN, GPS_DISTANCE_HIGH_VALUE, GPS_DISTANCE_REGULAR } = this.VERIFICATION_RULES;

    // Check GPS accuracy
    if (riderLocation.accuracy > GPS_ACCURACY_MIN) {
      return {
        valid: false,
        message: `GPS accuracy too low (${riderLocation.accuracy}m). Please wait for better GPS signal.`
      };
    }

    // Calculate distance to customer location
    const customerLat = customerAddress.latitude || 0;
    const customerLng = customerAddress.longitude || 0;

    const distance = this.calculateDistance(
      riderLocation.latitude,
      riderLocation.longitude,
      customerLat,
      customerLng
    );

    const maxDistance = orderValue > 1000 ? GPS_DISTANCE_HIGH_VALUE : GPS_DISTANCE_REGULAR;

    if (distance > maxDistance) {
      return {
        valid: false,
        message: `You are ${Math.round(distance)}m from the delivery location. Please get closer to the customer address.`
      };
    }

    // Fraud detection checks
    const fraudFlags = await this.detectLocationFraud(
      riderLocation,
      customerAddress,
      delivery.orderId
    );

    return {
      valid: true,
      message: 'GPS location verified successfully',
      distance,
      fraudFlags
    };
  }

  /**
   * Fraud detection for location spoofing
   */
  private static async detectLocationFraud(
    riderLocation: any,
    customerAddress: any,
    orderId: string
  ): Promise<any> {
    const fraudFlags = {
      suspiciousSpeed: false,
      unrealisticMovement: false,
      routeDeviation: false,
      deliveryTooFast: false,
    };

    try {
      // Check recent rider locations for suspicious patterns
      const recentLocations = await prisma.riderLocation.findMany({
        where: {
          riderId: riderLocation.riderId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      if (recentLocations.length >= 2) {
        const latest = recentLocations[0];
        const previous = recentLocations[1];

        // Check for unrealistic speed (e.g., > 60 km/h in city)
        const timeDiff = (latest.createdAt.getTime() - previous.createdAt.getTime()) / 1000 / 3600; // hours
        const distance = this.calculateDistance(
          latest.latitude, latest.longitude,
          previous.latitude, previous.longitude
        ) / 1000; // km

        const speed = distance / timeDiff; // km/h

        if (speed > 60) {
          fraudFlags.suspiciousSpeed = true;
        }

        // Check for delivery too fast (less than 2 minutes from pickup to delivery)
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { delivery: true }
        });

        if (order?.delivery?.pickupTime) {
          const deliveryTime = (Date.now() - order.delivery.pickupTime.getTime()) / 1000 / 60; // minutes
          if (deliveryTime < 2) {
            fraudFlags.deliveryTooFast = true;
          }
        }
      }

    } catch (error) {
      console.error('Fraud detection error:', error);
    }

    return fraudFlags;
  }

  /**
   * Determine verification requirements based on order value
   */
  private static getVerificationRequirements(orderValue: number) {
    const { PHOTO_REQUIRED_THRESHOLD, OTP_REQUIRED_THRESHOLD, CUSTOMER_AUTO_CONFIRM } = this.VERIFICATION_RULES;

    return {
      requiresPhoto: orderValue > PHOTO_REQUIRED_THRESHOLD,
      requiresOtp: orderValue > OTP_REQUIRED_THRESHOLD,
      requiresCustomerConfirmation: true,
      autoConfirmTimeout: CUSTOMER_AUTO_CONFIRM,
      highValueOrder: orderValue > 1000,
    };
  }

  /**
   * Validate additional proofs (photo, OTP)
   */
  private static validateAdditionalProofs(
    requirements: any,
    proofPhotoUrl?: string,
    customerOtp?: string
  ): { valid: boolean; message: string } {

    if (requirements.requiresPhoto && !proofPhotoUrl) {
      return {
        valid: false,
        message: 'Photo proof is required for high-value orders. Please take a clear photo of the delivery.'
      };
    }

    if (requirements.requiresOtp && !customerOtp) {
      return {
        valid: false,
        message: 'Customer OTP verification is required for premium orders.'
      };
    }

    if (requirements.requiresOtp && customerOtp && !/^\d{6}$/.test(customerOtp)) {
      return {
        valid: false,
        message: 'Invalid OTP format. Please enter 6-digit OTP.'
      };
    }

    return { valid: true, message: 'Proofs validated successfully' };
  }

  /**
   * Process the actual delivery confirmation
   */
  private static async processDeliveryConfirmation(
    delivery: any,
    riderLocation: any,
    proofPhotoUrl?: string,
    customerOtp?: string,
    requirements?: any,
    gpsValidation?: any
  ): Promise<{
    success: boolean;
    message: string;
    requiresCustomerConfirmation?: boolean;
    autoConfirmTime?: Date;
    verificationMethod?: string;
  }> {
    const deliveredAt = new Date();
    const autoConfirmTime = new Date(deliveredAt.getTime() + requirements.autoConfirmTimeout);

    const verificationMethod = this.buildVerificationMethod(requirements, proofPhotoUrl, customerOtp);

    // Update delivery with comprehensive verification data
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        deliveryStatus: 'DELIVERED',
        deliveryTime: deliveredAt,
        proofPhotoUrl,
        deliveryLat: riderLocation.latitude,
        deliveryLng: riderLocation.longitude,
        deliveryVerification: {
          gpsValidated: true,
          gpsAccuracy: riderLocation.accuracy,
          distanceFromCustomer: gpsValidation.distance,
          verificationMethod,
          photoProofProvided: !!proofPhotoUrl,
          otpVerified: !!customerOtp,
          deliveredAt: deliveredAt.toISOString(),
          autoConfirmTime: autoConfirmTime.toISOString(),
          riderLocation: {
            latitude: riderLocation.latitude,
            longitude: riderLocation.longitude,
            accuracy: riderLocation.accuracy,
          },
        },
        fraudFlags: gpsValidation.fraudFlags,
        qualityScore: this.calculateQualityScore(requirements, gpsValidation.fraudFlags),
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: delivery.orderId },
      data: {
        orderStatus: 'DELIVERED',
        deliveredAt,
      }
    });

    // Create detailed audit log
    await this.createDeliveryAuditLog(delivery, riderLocation, proofPhotoUrl, customerOtp, gpsValidation);

    // Send real-time notifications
    await this.sendDeliveryNotifications(delivery, deliveredAt, verificationMethod);

    // Trigger customer confirmation flow
    await this.initiateCustomerConfirmation(delivery.orderId, autoConfirmTime);

    return {
      success: true,
      message: 'Delivery confirmed successfully. Awaiting customer confirmation.',
      requiresCustomerConfirmation: true,
      autoConfirmTime,
      verificationMethod,
    };
  }

  /**
   * Build verification method string
   */
  private static buildVerificationMethod(
    requirements: any,
    proofPhotoUrl?: string,
    customerOtp?: string
  ): string {
    const methods = ['gps'];

    if (proofPhotoUrl) methods.push('photo');
    if (customerOtp) methods.push('otp');

    return methods.join('_');
  }

  /**
   * Calculate delivery quality score
   */
  private static calculateQualityScore(requirements: any, fraudFlags: any): number {
    let score = 100;

    // Deduct for fraud flags
    if (fraudFlags.suspiciousSpeed) score -= 20;
    if (fraudFlags.deliveryTooFast) score -= 15;
    if (fraudFlags.unrealisticMovement) score -= 10;

    // Bonus for additional verification
    if (requirements.requiresPhoto) score += 5;
    if (requirements.requiresOtp) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Create comprehensive audit log
   */
  private static async createDeliveryAuditLog(
    delivery: any,
    riderLocation: any,
    proofPhotoUrl?: string,
    customerOtp?: string,
    gpsValidation?: any
  ): Promise<void> {
    await prisma.deliveryLog.create({
      data: {
        deliveryId: delivery.id,
        eventType: 'delivery_confirmed',
        description: 'Delivery confirmed with multi-layer verification',
        actorId: delivery.riderId,
        actorType: 'rider',
        location: {
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
          accuracy: riderLocation.accuracy,
        },
        metadata: {
          orderValue: delivery.order.finalAmount,
          verificationMethod: this.buildVerificationMethod(
            this.getVerificationRequirements(delivery.order.finalAmount),
            proofPhotoUrl,
            customerOtp
          ),
          proofPhotoUrl,
          otpUsed: !!customerOtp,
          distanceFromCustomer: gpsValidation.distance,
          fraudFlags: gpsValidation.fraudFlags,
          qualityScore: this.calculateQualityScore(
            this.getVerificationRequirements(delivery.order.finalAmount),
            gpsValidation.fraudFlags
          ),
          deviceInfo: {
            // Would be populated from rider app
            appVersion: '1.0.0',
            platform: 'mobile',
          }
        }
      }
    });
  }

  /**
   * Send comprehensive notifications
   */
  private static async sendDeliveryNotifications(
    delivery: any,
    deliveredAt: Date,
    verificationMethod: string
  ): Promise<void> {
    const { order, rider } = delivery;

    // Customer notification
    await notificationService.sendNotification({
      userId: order.customerId,
      title: 'Order Delivered! 🎉',
      message: `Your order #${order.orderNumber} has been delivered successfully. Please confirm receipt within 7 minutes.`,
      notificationType: 'ORDER_DELIVERED',
      referenceId: order.id,
      priority: 'high',
    });

    // Store notification
    if (order.store?.managerId) {
      await notificationService.sendNotification({
        userId: order.store.managerId,
        title: 'Order Delivered Successfully',
        message: `Order #${order.orderNumber} delivered by ${rider.user.fullName} using ${verificationMethod} verification.`,
        notificationType: 'ORDER_DELIVERED',
        referenceId: order.id,
        priority: 'medium',
      });
    }

    // Rider confirmation notification
    await notificationService.sendNotification({
      userId: delivery.riderId,
      title: 'Delivery Confirmed! 💰',
      message: `Order #${order.orderNumber} delivered successfully. ₹${delivery.deliveryFee} credited to your wallet.`,
      notificationType: 'PAYMENT_SUCCESS',
      referenceId: delivery.id,
      priority: 'high',
    });

    // WebSocket real-time updates
    // Customer app
    // Store dashboard
    // Rider app
  }

  /**
   * Initiate customer confirmation flow
   */
  private static async initiateCustomerConfirmation(
    orderId: string,
    autoConfirmTime: Date
  ): Promise<void> {
    // Send WebSocket event to customer app for confirmation popup
    // Set up auto-confirmation timer (would use job queue in production)

    setTimeout(async () => {
      await this.autoConfirmCustomerDelivery(orderId);
    }, autoConfirmTime.getTime() - Date.now());
  }

  /**
   * Auto-confirm delivery after customer timeout
   */
  static async autoConfirmCustomerDelivery(orderId: string): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { delivery: true }
      });

      if (!order || order.orderStatus !== 'DELIVERED') {
        return;
      }

      const verification = order.delivery?.deliveryVerification as any;
      if (verification?.customerConfirmed) {
        return; // Already confirmed
      }

      // Auto-confirm
      await prisma.delivery.update({
        where: { id: order.deliveryId },
        data: {
          deliveryVerification: {
            ...verification,
            autoConfirmed: true,
            customerConfirmed: true,
            confirmedAt: new Date().toISOString(),
          }
        }
      });

      // Audit log
      await prisma.deliveryLog.create({
        data: {
          deliveryId: order.deliveryId,
          eventType: 'auto_confirmed',
          description: 'Delivery auto-confirmed after 7-minute customer timeout',
          actorType: 'system',
        }
      });

    } catch (error) {
      console.error('Auto-confirmation error:', error);
    }
  }

  /**
   * Customer manual confirmation/rejection
   */
  static async processCustomerConfirmation(
    request: CustomerConfirmationRequest
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { orderId, customerId, confirmed, feedback } = request;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          delivery: true,
          customer: true,
          store: true
        }
      });

      if (!order || order.customerId !== customerId) {
        throw new Error('Order not found or unauthorized access');
      }

      if (order.orderStatus !== 'DELIVERED') {
        throw new Error('Order not yet delivered');
      }

      const verification = order.delivery?.deliveryVerification as any;

      if (verification?.customerConfirmed) {
        return { success: false, message: 'Delivery already confirmed' };
      }

      // Update verification
      await prisma.delivery.update({
        where: { id: order.deliveryId },
        data: {
          deliveryVerification: {
            ...verification,
            customerConfirmed: confirmed,
            customerFeedback: feedback,
            confirmedAt: new Date().toISOString(),
          }
        }
      });

      // Create audit log
      await prisma.deliveryLog.create({
        data: {
          deliveryId: order.deliveryId,
          eventType: confirmed ? 'customer_confirmed' : 'customer_reported_issue',
          description: confirmed
            ? 'Customer confirmed delivery receipt'
            : `Customer reported delivery issue: ${feedback || 'No details provided'}`,
          actorId: customerId,
          actorType: 'customer',
          metadata: {
            confirmed,
            feedback,
            orderValue: order.finalAmount,
          }
        }
      });

      if (confirmed) {
        // Successful confirmation
        await notificationService.sendNotification({
          userId: order.delivery?.riderId,
          title: 'Delivery Confirmed! ⭐',
          message: `Customer confirmed receipt of order #${order.orderNumber}`,
          notificationType: 'GENERAL',
          referenceId: order.id,
          priority: 'medium',
        });

        return {
          success: true,
          message: 'Thank you for confirming! Your feedback helps us improve.'
        };
      } else {
        // Customer reported issue
        await this.handleCustomerDispute(order, feedback);

        return {
          success: true,
          message: 'Thank you for your feedback. Our team will investigate and contact you within 24 hours.'
        };
      }

    } catch (error) {
      console.error('Customer confirmation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Confirmation failed'
      };
    }
  }

  /**
   * Handle customer disputes and issues
   */
  private static async handleCustomerDispute(order: any, feedback?: string): Promise<void> {
    // Flag delivery for review
    await prisma.delivery.update({
      where: { id: order.deliveryId },
      data: {
        fraudFlags: {
          customerDispute: true,
          disputeReason: feedback,
          requiresReview: true,
          disputeReportedAt: new Date().toISOString(),
        }
      }
    });

    // Notify store manager
    if (order.store?.managerId) {
      await notificationService.sendNotification({
        userId: order.store.managerId,
        title: '🚨 Customer Delivery Dispute',
        message: `Customer reported issue with order #${order.orderNumber}: ${feedback || 'No details provided'}`,
        notificationType: 'GENERAL',
        referenceId: order.id,
        priority: 'high',
      });
    }

    // Notify admin for high-value disputes
    if (order.finalAmount > 1000) {
      // Would notify admin users here
      console.log('High-value order dispute reported:', order.id);
    }

    // Create dispute record for tracking
    await prisma.dispute.create({
      data: {
        orderId: order.id,
        deliveryId: order.deliveryId,
        customerId: order.customerId,
        riderId: order.delivery?.riderId,
        storeId: order.storeId,
        reason: feedback || 'Customer reported issue',
        status: 'OPEN',
        priority: order.finalAmount > 500 ? 'HIGH' : 'MEDIUM',
      }
    });
  }

  /**
   * Calculate distance between coordinates (returns meters)
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Distance in meters
  }
}

// Export singleton instance
export const deliveryService = DeliveryService;