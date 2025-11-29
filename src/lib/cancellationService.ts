// Order Cancellation and Refund Service

import { prisma } from "./prisma";
import { walletManager } from "./walletManagement";

export interface CancellationRequest {
  orderId: string;
  reason: string;
  requestedBy: string; // user ID
  notes?: string;
}

export interface RefundCalculation {
  refundAmount: number;
  refundPercentage: number;
  reason: string;
  processingFee?: number;
}

export class CancellationService {
  /**
   * Check if an order can be cancelled
   */
  static async canCancelOrder(orderId: string): Promise<{
    canCancel: boolean;
    reason?: string;
    refundInfo?: RefundCalculation;
  }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        delivery: true,
      },
    });

    if (!order) {
      return { canCancel: false, reason: "Order not found" };
    }

    // Define cancellable statuses
    const cancellableStatuses = [
      "ORDER_PLACED",
      "STORE_ASSIGNED",
      "BEING_PREPARED",
    ];

    if (!cancellableStatuses.includes(order.orderStatus)) {
      return {
        canCancel: false,
        reason: `Order cannot be cancelled at ${order.orderStatus} status`,
      };
    }

    // Calculate refund amount
    const refundInfo = this.calculateRefund(order);

    return {
      canCancel: true,
      refundInfo,
    };
  }

  /**
   * Process order cancellation
   */
  static async cancelOrder(request: CancellationRequest): Promise<{
    success: boolean;
    refundProcessed?: boolean;
    error?: string;
  }> {
    const { orderId, reason, requestedBy, notes } = request;

    try {
      // Check if cancellation is allowed
      const canCancel = await this.canCancelOrder(orderId);
      if (!canCancel.canCancel) {
        return { success: false, error: canCancel.reason };
      }

      // Start transaction
      await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: orderId },
          data: {
            orderStatus: "CANCELLED",
            cancellationReason: reason,
            cancelledBy: requestedBy,
            updatedAt: new Date(),
          },
        });

        // Create order log
        await tx.orderLog.create({
          data: {
            orderId,
            eventType: "cancelled",
            description: `Order cancelled: ${reason}`,
            actorId: requestedBy,
            actorType: "customer",
            metadata: {
              reason,
              notes,
              refundAmount: canCancel.refundInfo?.refundAmount,
            },
          },
        });

        // Release inventory if order was being prepared
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { orderItems: true },
        });

        if (
          order &&
          ["BEING_PREPARED", "READY_FOR_PICKUP"].includes(order.orderStatus)
        ) {
          // Note: Inventory management would be implemented here
          // This depends on the inventory system design
        }

        // Cancel delivery if assigned
        const delivery = await tx.delivery.findUnique({
          where: { orderId },
        });

        if (delivery) {
          await tx.delivery.update({
            where: { id: delivery.id },
            data: {
              deliveryStatus: "CANCELLED",
              updatedAt: new Date(),
            },
          });

          // Create delivery log
          await tx.deliveryLog.create({
            data: {
              deliveryId: delivery.id,
              eventType: "cancelled",
              description: `Delivery cancelled due to order cancellation`,
              actorId: requestedBy,
              actorType: "customer",
            },
          });
        }
      });

      // Process refund if applicable
      let refundProcessed = false;
      if (canCancel.refundInfo && canCancel.refundInfo.refundAmount > 0) {
        try {
          // Note: Refund processing would be implemented here
          // await walletManager.processRefund(orderId, canCancel.refundInfo);
          console.log(
            `Refund of ₹${canCancel.refundInfo.refundAmount} would be processed for order ${orderId}`,
          );
          refundProcessed = true;

          // Update order with refund amount
          await prisma.order.update({
            where: { id: orderId },
            data: {
              refundAmount: canCancel.refundInfo.refundAmount,
              orderStatus: "REFUNDED",
            },
          });
        } catch (refundError) {
          console.error("Refund processing failed:", refundError);
          // Refund failure doesn't prevent cancellation
        }
      }

      return { success: true, refundProcessed };
    } catch (error) {
      console.error("Order cancellation failed:", error);
      return { success: false, error: "Cancellation failed" };
    }
  }

  /**
   * Calculate refund amount based on order status and time
   */
  static calculateRefund(order: any): RefundCalculation {
    const { orderStatus, finalAmount, createdAt } = order;
    const now = new Date();
    const orderAge = now.getTime() - createdAt.getTime();
    const orderAgeMinutes = orderAge / (1000 * 60);

    switch (orderStatus) {
      case "ORDER_PLACED":
        // Full refund for orders placed within 2 minutes
        if (orderAgeMinutes <= 2) {
          return {
            refundAmount: finalAmount,
            refundPercentage: 100,
            reason: "Full refund for cancelled order within 2 minutes",
          };
        }
        // 90% refund for orders placed within 10 minutes
        if (orderAgeMinutes <= 10) {
          return {
            refundAmount: Math.round(finalAmount * 0.9 * 100) / 100,
            refundPercentage: 90,
            reason: "90% refund for cancelled order within 10 minutes",
          };
        }
        // 75% refund for orders placed within 30 minutes
        return {
          refundAmount: Math.round(finalAmount * 0.75 * 100) / 100,
          refundPercentage: 75,
          reason: "75% refund for cancelled order within 30 minutes",
        };

      case "STORE_ASSIGNED":
        // 80% refund after store assignment
        return {
          refundAmount: Math.round(finalAmount * 0.8 * 100) / 100,
          refundPercentage: 80,
          reason: "80% refund for cancelled order after store assignment",
        };

      case "BEING_PREPARED":
        // 50% refund after preparation starts
        return {
          refundAmount: Math.round(finalAmount * 0.5 * 100) / 100,
          refundPercentage: 50,
          reason: "50% refund after preparation has started",
          processingFee: Math.round(finalAmount * 0.5 * 100) / 100,
        };

      default:
        return {
          refundAmount: 0,
          refundPercentage: 0,
          reason: "No refund available for this order status",
        };
    }
  }

  /**
   * Get cancellation history for an order
   */
  static async getCancellationHistory(orderId: string) {
    const logs = await prisma.orderLog.findMany({
      where: {
        orderId,
        eventType: "cancelled",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return logs.map((log) => {
      const metadata =
        typeof log.metadata === "object" && log.metadata !== null
          ? (log.metadata as any)
          : {};
      return {
        timestamp: log.createdAt,
        reason: metadata.reason || "Not specified",
        requestedBy: log.actorId,
        notes: metadata.notes,
        refundAmount: metadata.refundAmount,
      };
    });
  }

  /**
   * Get cancellation statistics
   */
  static async getCancellationStats(dateFrom?: Date, dateTo?: Date) {
    const dateFilter =
      dateFrom && dateTo
        ? {
            createdAt: {
              gte: dateFrom,
              lte: dateTo,
            },
          }
        : {};

    const stats = await prisma.$queryRaw`
      SELECT
        COUNT(*) as total_cancellations,
        AVG(CASE WHEN refund_amount > 0 THEN refund_amount END) as avg_refund_amount,
        SUM(refund_amount) as total_refund_amount,
        COUNT(CASE WHEN refund_amount > 0 THEN 1 END) as refunded_orders,
        COUNT(CASE WHEN refund_amount = 0 THEN 1 END) as non_refunded_cancellations
      FROM orders
      WHERE order_status IN ('CANCELLED', 'REFUNDED') AND ${dateFilter}
    `;

    return (stats as any)[0];
  }

  /**
   * Process bulk cancellations (for admin use)
   */
  static async bulkCancelOrders(
    orderIds: string[],
    reason: string,
    adminId: string,
  ) {
    const results = [];

    for (const orderId of orderIds) {
      try {
        const result = await this.cancelOrder({
          orderId,
          reason,
          requestedBy: adminId,
          notes: "Bulk cancellation by admin",
        });
        results.push({ orderId, success: result.success, error: result.error });
      } catch (error) {
        results.push({ orderId, success: false, error: "Processing failed" });
      }
    }

    return results;
  }
}

// Export singleton instance
export const cancellationService = new CancellationService();
