import { prisma } from "./prisma";

export interface WalletTransaction {
  walletId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  referenceId?: string; // orderId, deliveryId, etc.
  referenceType?: string; // order, delivery, payout, etc.
}

export interface PayoutRequest {
  walletId: string;
  amount: number;
  method: "bank_transfer" | "upi" | "wallet";
  accountDetails: {
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    walletId?: string;
  };
}

/**
 * Wallet management for stores and riders
 */
export class WalletManager {
  /**
   * Get wallet balance
   */
  async getBalance(walletId: string): Promise<number> {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      select: { currentBalance: true },
    });

    return wallet?.currentBalance || 0;
  }

  /**
   * Create wallet transaction
   */
  async createTransaction(transaction: WalletTransaction): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Create transaction record
      await tx.walletTransaction.create({
        data: {
          walletId: transaction.walletId,
          amount: transaction.amount,
          transactionType: transaction.type,
          description: transaction.description,
          balanceAfter: 0, // Will be calculated
        },
      });

      // Update wallet balance
      const increment =
        transaction.type === "CREDIT"
          ? transaction.amount
          : -transaction.amount;

      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          currentBalance: {
            increment,
          },
          totalEarned:
            transaction.type === "CREDIT"
              ? { increment: transaction.amount }
              : undefined,
          totalWithdrawn:
            transaction.type === "DEBIT"
              ? { increment: transaction.amount }
              : undefined,
          lastUpdatedAt: new Date(),
        },
      });

      // Update balance_after in transaction
      const wallet = await tx.wallet.findUnique({
        where: { id: transaction.walletId },
        select: { currentBalance: true },
      });

      await tx.walletTransaction.updateMany({
        where: {
          walletId: transaction.walletId,
          balanceAfter: 0, // Temporary value
        },
        data: {
          balanceAfter: wallet!.currentBalance,
        },
      });
    });
  }

  /**
   * Process order payment to store wallet
   */
  async processOrderPayment(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        merchant: true, // Will be store after migration
      },
    });

    if (!order) throw new Error("Order not found");

    // Calculate store earnings (order amount - platform commission)
    const commission = order.finalAmount * 0.1; // 10% commission
    const storeEarnings = order.finalAmount - commission;

    // Credit store wallet
    const storeWallet = await prisma.wallet.findFirst({
      where: {
        userId: order.merchant.userId, // Will be storeId after migration
        userType: "merchant", // Will be "store" after migration
      },
    });

    if (storeWallet) {
      await this.createTransaction({
        walletId: storeWallet.id,
        amount: storeEarnings,
        type: "CREDIT",
        description: `Payment for order ${order.orderNumber}`,
        referenceId: orderId,
        referenceType: "order",
      });
    }
  }

  /**
   * Process delivery payment to rider wallet
   */
  async processDeliveryPayment(deliveryId: string): Promise<void> {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        rider: true,
        order: true,
      },
    });

    if (!delivery || !delivery.rider)
      throw new Error("Delivery or rider not found");

    // Rider earnings (already calculated in delivery)
    const riderEarnings = delivery.riderEarnings;

    // Credit rider wallet
    const riderWallet = await prisma.wallet.findFirst({
      where: {
        userId: delivery.rider.userId,
        userType: "rider",
      },
    });

    if (riderWallet) {
      await this.createTransaction({
        walletId: riderWallet.id,
        amount: riderEarnings,
        type: "CREDIT",
        description: `Delivery payment for order ${delivery.order.orderNumber}`,
        referenceId: deliveryId,
        referenceType: "delivery",
      });
    }
  }

  /**
   * Process payout request
   */
  async processPayout(payoutRequest: PayoutRequest): Promise<string> {
    const wallet = await prisma.wallet.findUnique({
      where: { id: payoutRequest.walletId },
      select: { currentBalance: true, userId: true },
    });

    if (!wallet) throw new Error("Wallet not found");
    if (wallet.currentBalance < payoutRequest.amount) {
      throw new Error("Insufficient balance");
    }

    // Create payout transaction
    await this.createTransaction({
      walletId: payoutRequest.walletId,
      amount: payoutRequest.amount,
      type: "DEBIT",
      description: `Payout via ${payoutRequest.method}`,
      referenceType: "payout",
    });

    // Here you would integrate with actual payout services
    // For now, just return a reference
    const payoutReference = `PYT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you would:
    // 1. Call bank transfer API
    // 2. Call UPI transfer API
    // 3. Update payout status
    // 4. Send confirmation notifications

    return payoutReference;
  }

  /**
   * Get wallet transaction history
   */
  async getTransactionHistory(
    walletId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: "credit" | "debit";
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ): Promise<any[]> {
    const where: any = { walletId };

    if (options.type) {
      where.transactionType = options.type;
    }

    if (options.dateFrom || options.dateTo) {
      where.createdAt = {};
      if (options.dateFrom) where.createdAt.gte = options.dateFrom;
      if (options.dateTo) where.createdAt.lte = options.dateTo;
    }

    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options.limit || 50,
      skip: options.offset || 0,
    });

    return transactions;
  }

  /**
   * Get wallet summary
   */
  async getWalletSummary(walletId: string): Promise<{
    currentBalance: number;
    totalEarned: number;
    totalWithdrawn: number;
    pendingPayouts: number;
    availableBalance: number;
  }> {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      select: {
        currentBalance: true,
        totalEarned: true,
        totalWithdrawn: true,
      },
    });

    if (!wallet) throw new Error("Wallet not found");

    // Calculate pending payouts (simplified - in real implementation, track payout requests)
    const pendingPayouts = 0; // Would query payout_requests table
    const availableBalance = wallet.currentBalance - pendingPayouts;

    return {
      currentBalance: wallet.currentBalance,
      totalEarned: wallet.totalEarned,
      totalWithdrawn: wallet.totalWithdrawn,
      pendingPayouts,
      availableBalance,
    };
  }

  /**
   * Transfer funds between wallets (for refunds, adjustments, etc.)
   */
  async transferFunds(
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    description: string,
    referenceId?: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Debit from source wallet
      await tx.wallet.update({
        where: { id: fromWalletId },
        data: {
          currentBalance: { decrement: amount },
          totalWithdrawn: { increment: amount },
          lastUpdatedAt: new Date(),
        },
      });

      // Credit to destination wallet
      await tx.wallet.update({
        where: { id: toWalletId },
        data: {
          currentBalance: { increment: amount },
          totalEarned: { increment: amount },
          lastUpdatedAt: new Date(),
        },
      });

      // Create transaction records
      const fromWallet = await tx.wallet.findUnique({
        where: { id: fromWalletId },
        select: { currentBalance: true },
      });

      const toWallet = await tx.wallet.findUnique({
        where: { id: toWalletId },
        select: { currentBalance: true },
      });

      await tx.walletTransaction.createMany({
        data: [
          {
            walletId: fromWalletId,
            amount,
            transactionType: "DEBIT",
            description: `Transfer to wallet: ${description}`,
            balanceAfter: fromWallet!.currentBalance,
          },
          {
            walletId: toWalletId,
            amount,
            transactionType: "CREDIT",
            description: `Transfer from wallet: ${description}`,
            balanceAfter: toWallet!.currentBalance,
          },
        ],
      });
    });
  }
}

// Export singleton instance
export const walletManager = new WalletManager();
