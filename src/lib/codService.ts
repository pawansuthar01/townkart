// Cash on Delivery (COD) Service for TownKart
// Complete cash management system with fraud prevention and settlement tracking

import { NotificationService } from "@/services/notification.service";
import { prisma } from "./prisma";
// import { notificationService } from "./notificationSystem"; // Temporarily commented out

export interface CashCollectionRequest {
  deliveryId: string;
  riderId: string;
  amount: number;
  riderLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  customerOtp?: string;
  photoProofUrl?: string;
}

export interface CashDepositRequest {
  riderId: string;
  storeId: string;
  amount: number;
  riderLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  notes?: string;
}

export interface CashSettlementRequest {
  riderId: string;
  storeId: string;
  settlementDate: Date;
  notes?: string;
}

export class CODService {
  // COD thresholds and limits
  private static readonly COD_LIMITS = {
    MAX_DAILY_COD: 50000, // Max COD per rider per day
    MAX_OUTSTANDING_CASH: 10000, // Max outstanding cash before settlement required
    SETTLEMENT_GRACE_PERIOD: 24 * 60 * 60 * 1000, // 24 hours
    HIGH_VALUE_THRESHOLD: 1000, // High-value orders requiring extra verification
  };

  /**
   * Record cash collection from customer
   */
  static async recordCashCollection(request: CashCollectionRequest): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
    requiresImmediateSettlement?: boolean;
  }> {
    try {
      const {
        deliveryId,
        riderId,
        amount,
        riderLocation,
        customerOtp,
        photoProofUrl,
      } = request;

      // Get delivery and order details
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          order: {
            include: {
              customer: true,
              store: true,
            },
          },
          rider: true,
        },
      });

      if (!delivery) {
        throw new Error("Delivery not found");
      }

      if (delivery.riderId !== riderId) {
        throw new Error("Unauthorized rider");
      }

      // Validate amount matches order total
      if (Math.abs(amount - delivery.order.finalAmount) > 0.01) {
        throw new Error("Cash amount does not match order total");
      }

      // Check daily COD limit
      await this.validateDailyCODLimit(riderId, amount);

      // Validate high-value order requirements
      if (amount > this.COD_LIMITS.HIGH_VALUE_THRESHOLD) {
        await this.validateHighValueOrderVerification(
          delivery.order,
          customerOtp,
          photoProofUrl
        );
      }

      // Create cash transaction record
      const transaction = await prisma.cashTransaction.create({
        data: {
          riderId,
          orderId: delivery.orderId,
          amount,
          transactionType: "COLLECTED",
          collectedLat: riderLocation.latitude,
          collectedLng: riderLocation.longitude,
          collectedAt: new Date(),
          otpVerified: !!customerOtp,
          photoProofUrl,
          notes: `Cash collected for order ${delivery.order.orderNumber}`,
        },
      });

      // Update rider cash balance
      await this.updateRiderCashBalance(riderId, amount, "COLLECTED");

      // Check if immediate settlement is required
      const riderBalance = await this.getRiderCashBalance(riderId);
      const requiresImmediateSettlement =
        riderBalance.outstandingAmount > this.COD_LIMITS.MAX_OUTSTANDING_CASH;

      // Send notifications
      await this.sendCashCollectionNotifications(
        delivery,
        amount,
        requiresImmediateSettlement
      );

      // Log the transaction
      await this.logCashTransaction(delivery, transaction, "COLLECTED");

      return {
        success: true,
        message: `Cash collection of ₹${amount} recorded successfully`,
        transactionId: transaction.id,
        requiresImmediateSettlement,
      };
    } catch (error) {
      console.error("Cash collection error:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Cash collection failed",
      };
    }
  }

  /**
   * Record cash deposit at store/hub
   */
  static async recordCashDeposit(request: CashDepositRequest): Promise<{
    success: boolean;
    message: string;
    settlementId?: string;
  }> {
    try {
      const { riderId, storeId, amount, riderLocation, notes } = request;

      // Validate rider and store
      const rider = await prisma.riderProfile.findUnique({
        where: { id: riderId },
        include: { user: true },
      });

      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });

      if (!rider || !store) {
        throw new Error("Rider or store not found");
      }

      // Check if rider has sufficient outstanding cash
      const riderBalance = await this.getRiderCashBalance(riderId);
      if (riderBalance.outstandingAmount < amount) {
        throw new Error(
          `Insufficient outstanding cash. Available: ₹${riderBalance.outstandingAmount}`
        );
      }

      // Create deposit transaction
      const transaction = await prisma.cashTransaction.create({
        data: {
          riderId,
          storeId,
          amount,
          transactionType: "DEPOSITED",
          collectedLat: riderLocation.latitude,
          collectedLng: riderLocation.longitude,
          depositedAt: new Date(),
          notes: notes || `Cash deposited at ${store.name}`,
        },
      });

      // Update rider cash balance
      await this.updateRiderCashBalance(riderId, amount, "DEPOSITED");

      // Create or update settlement record
      const settlement = await this.createSettlementRecord(
        riderId,
        storeId,
        amount
      );

      // Send notifications
      await this.sendCashDepositNotifications(rider, store, amount);

      // Log the transaction
      await this.logCashTransaction(null, transaction, "DEPOSITED");

      return {
        success: true,
        message: `Cash deposit of ₹${amount} recorded successfully`,
        settlementId: settlement.id,
      };
    } catch (error) {
      console.error("Cash deposit error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Cash deposit failed",
      };
    }
  }

  /**
   * Process cash settlement (admin/store manager function)
   */
  static async processCashSettlement(request: CashSettlementRequest): Promise<{
    success: boolean;
    message: string;
    settlementDetails?: any;
  }> {
    try {
      const { riderId, storeId, settlementDate, notes } = request;

      // Get all pending transactions for the rider
      const pendingTransactions = await prisma.cashTransaction.findMany({
        where: {
          riderId,
          status: "PENDING",
          transactionType: "COLLECTED",
        },
        include: {
          order: true,
        },
      });

      const totalCollected = pendingTransactions.reduce(
        (sum, t) => sum + t.amount,
        0
      );

      // Get deposits for the settlement period
      const deposits = await prisma.cashTransaction.findMany({
        where: {
          riderId,
          storeId,
          transactionType: "DEPOSITED",
          depositedAt: {
            gte: new Date(settlementDate.getTime() - 24 * 60 * 60 * 1000), // Previous day
            lte: settlementDate,
          },
        },
      });

      const totalDeposited = deposits.reduce((sum, d) => sum + d.amount, 0);
      const difference = totalDeposited - totalCollected;

      // Create settlement record
      const settlement = await prisma.cashSettlement.create({
        data: {
          riderId,
          storeId,
          totalCollected,
          totalDeposited,
          difference,
          settlementDate,
          status: Math.abs(difference) < 1 ? "VERIFIED" : "DISPUTED", // Auto-verify if difference < ₹1
          notes,
          transactions: {
            connect: [
              ...pendingTransactions.map((t) => ({ id: t.id })),
              ...deposits.map((d) => ({ id: d.id })),
            ],
          },
        },
        include: {
          rider: {
            include: { user: true },
          },
          store: true,
          transactions: true,
        },
      });

      // Update transaction statuses
      await prisma.cashTransaction.updateMany({
        where: {
          id: {
            in: [
              ...pendingTransactions.map((t) => t.id),
              ...deposits.map((d) => d.id),
            ],
          },
        },
        data: {
          status: settlement.status,
          settlementBatchId: settlement.id,
          settledAt: new Date(),
        },
      });

      // Update rider balance
      await this.updateRiderCashBalance(riderId, totalDeposited, "SETTLED");

      // Send notifications
      await this.sendSettlementNotifications(settlement);

      return {
        success: true,
        message: `Settlement processed successfully. Difference: ₹${difference}`,
        settlementDetails: settlement,
      };
    } catch (error) {
      console.error("Settlement processing error:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Settlement processing failed",
      };
    }
  }

  /**
   * Get rider cash balance and status
   */
  static async getRiderCashBalance(riderId: string): Promise<{
    totalCollected: number;
    totalDeposited: number;
    outstandingAmount: number;
    riskLevel: string;
    settlementRequired: boolean;
    nextSettlementDue?: Date;
  }> {
    const balance = await prisma.riderCashBalance.findUnique({
      where: { riderId },
    });

    if (!balance) {
      // Create initial balance record
      const newBalance = await prisma.riderCashBalance.create({
        data: { riderId },
      });
      return {
        totalCollected: 0,
        totalDeposited: 0,
        outstandingAmount: 0,
        riskLevel: "LOW",
        settlementRequired: false,
      };
    }

    const outstandingAmount = balance.totalCollected - balance.totalDeposited;
    const settlementRequired =
      outstandingAmount > this.COD_LIMITS.MAX_OUTSTANDING_CASH;

    // Calculate risk level
    let riskLevel = "LOW";
    if (outstandingAmount > 8000) riskLevel = "HIGH";
    else if (outstandingAmount > 5000) riskLevel = "MEDIUM";

    return {
      totalCollected: balance.totalCollected,
      totalDeposited: balance.totalDeposited,
      outstandingAmount,
      riskLevel,
      settlementRequired,
      nextSettlementDue: balance.nextSettlementDue || undefined,
    };
  }

  /**
   * Validate daily COD limit
   */
  private static async validateDailyCODLimit(
    riderId: string,
    newAmount: number
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCollections = await prisma.cashTransaction.aggregate({
      where: {
        riderId,
        transactionType: "COLLECTED",
        collectedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const todayTotal = (todayCollections._sum.amount || 0) + newAmount;

    if (todayTotal > this.COD_LIMITS.MAX_DAILY_COD) {
      throw new Error(
        `Daily COD limit exceeded. Today: ₹${todayTotal}, Limit: ₹${this.COD_LIMITS.MAX_DAILY_COD}`
      );
    }
  }

  /**
   * Validate high-value order verification
   */
  private static async validateHighValueOrderVerification(
    order: any,
    customerOtp?: string,
    photoProofUrl?: string
  ): Promise<void> {
    if (!customerOtp) {
      throw new Error("OTP verification required for high-value COD orders");
    }

    if (!photoProofUrl) {
      throw new Error("Photo proof required for high-value COD orders");
    }

    // Additional validation can be added here
    // e.g., check if OTP matches customer's phone, validate photo content, etc.
  }

  /**
   * Update rider cash balance
   */
  private static async updateRiderCashBalance(
    riderId: string,
    amount: number,
    operation: "COLLECTED" | "DEPOSITED" | "SETTLED"
  ): Promise<void> {
    const balance = await prisma.riderCashBalance.findUnique({
      where: { riderId },
    });

    if (!balance) {
      // Create new balance record
      await prisma.riderCashBalance.create({
        data: {
          riderId,
          totalCollected: operation === "COLLECTED" ? amount : 0,
          totalDeposited: operation === "DEPOSITED" ? amount : 0,
          outstandingAmount: operation === "COLLECTED" ? amount : 0,
        },
      });
    } else {
      // Update existing balance
      const updateData: any = {};

      if (operation === "COLLECTED") {
        updateData.totalCollected = { increment: amount };
        updateData.outstandingAmount = { increment: amount };
      } else if (operation === "DEPOSITED") {
        updateData.totalDeposited = { increment: amount };
        updateData.outstandingAmount = { decrement: amount };
      }

      await prisma.riderCashBalance.update({
        where: { riderId },
        data: updateData,
      });
    }
  }

  /**
   * Create settlement record
   */
  private static async createSettlementRecord(
    riderId: string,
    storeId: string,
    depositedAmount: number
  ): Promise<any> {
    const settlementDate = new Date();

    return await prisma.cashSettlement.create({
      data: {
        riderId,
        storeId,
        totalDeposited: depositedAmount,
        settlementDate,
        status: "SUBMITTED",
      },
    });
  }

  /**
   * Send notifications for cash operations
   */
  private static async sendCashCollectionNotifications(
    delivery: any,
    amount: number,
    requiresImmediateSettlement: boolean
  ): Promise<void> {
    const { order, rider } = delivery;

    // Notify rider
    await NotificationService.sendNotification({
      userId: rider.userId,
      title: "💰 Cash Collected Successfully",
      message: `₹${amount} collected for order #${order.orderNumber}. ${requiresImmediateSettlement ? "Please deposit cash immediately." : ""}`,
      notificationType: "GENERAL",
      referenceId: delivery.id,
      priority: requiresImmediateSettlement ? "high" : "medium",
    });

    // Notify store if immediate settlement required
    if (requiresImmediateSettlement && order.store?.managerId) {
      await NotificationService.sendNotification({
        userId: order.store.managerId,
        title: "🚨 Rider Requires Immediate Cash Settlement",
        message: `${rider.user.fullName} has ₹${amount} outstanding cash. Please arrange settlement.`,
        notificationType: "GENERAL",
        referenceId: delivery.id,
        priority: "high",
      });
    }
  }

  /**
   * Send cash deposit notifications
   */
  private static async sendCashDepositNotifications(
    rider: any,
    store: any,
    amount: number
  ): Promise<void> {
    // Notify rider
    await NotificationService.sendNotification({
      userId: rider.userId,
      title: "✅ Cash Deposit Confirmed",
      message: `₹${amount} deposited successfully at ${store.name}`,
      notificationType: "GENERAL",
      priority: "medium",
    });

    // Notify store manager
    if (store.managerId) {
      await NotificationService.sendNotification({
        userId: store.managerId,
        title: "💰 Cash Deposit Received",
        message: `${rider.user.fullName} deposited ₹${amount}`,
        notificationType: "GENERAL",
        priority: "medium",
      });
    }
  }

  /**
   * Send settlement notifications
   */
  private static async sendSettlementNotifications(
    settlement: any
  ): Promise<void> {
    const { rider, store } = settlement;

    // Notify rider
    await NotificationService.sendNotification({
      userId: rider.userId,
      title:
        settlement.status === "VERIFIED"
          ? "✅ Settlement Completed"
          : "⚠️ Settlement Requires Review",
      message: `Cash settlement processed. ${settlement.difference !== 0 ? `Difference: ₹${settlement.difference}` : "No discrepancies found."}`,
      notificationType: "GENERAL",
      referenceId: settlement.id,
      priority: settlement.status === "DISPUTED" ? "high" : "medium",
    });

    // Notify store manager
    if (store.managerId) {
      await NotificationService.sendNotification({
        userId: store.managerId,
        title: "💼 Cash Settlement Processed",
        message: `${rider.user.fullName} settlement: Collected ₹${settlement.totalCollected}, Deposited ₹${settlement.totalDeposited}`,
        notificationType: "GENERAL",
        referenceId: settlement.id,
        priority: "medium",
      });
    }
  }

  /**
   * Log cash transaction for audit
   */
  private static async logCashTransaction(
    delivery: any,
    transaction: any,
    operation: string
  ): Promise<void> {
    // This would integrate with your existing logging system
    console.log(`COD ${operation}:`, {
      transactionId: transaction.id,
      riderId: transaction.riderId,
      orderId: delivery?.orderId,
      amount: transaction.amount,
      location: {
        lat: transaction.collectedLat || transaction.depositedLat,
        lng: transaction.collectedLng || transaction.depositedLng,
      },
      timestamp: transaction.collectedAt || transaction.depositedAt,
    });
  }
}

// Export singleton instance
export const codService = CODService;
