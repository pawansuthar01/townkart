// Payment Gateway Integration Utilities

export interface PaymentConfig {
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
  upi: {
    merchantId: string;
    merchantKey: string;
  };
  cod: {
    enabled: boolean;
    maxAmount: number;
    riskThreshold: number;
  };
}

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentVerification {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RefundRequest {
  paymentId: string;
  amount: number;
  reason: string;
  speed?: "normal" | "optimum";
}

// Default payment configuration
export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },
  upi: {
    merchantId: process.env.UPI_MERCHANT_ID || "",
    merchantKey: process.env.UPI_MERCHANT_KEY || "",
  },
  cod: {
    enabled: true,
    maxAmount: 5000, // ₹5000 max for COD
    riskThreshold: 1000, // Risk assessment above ₹1000
  },
};

// Payment method types
export type PaymentMethod = "card" | "upi" | "netbanking" | "wallet" | "cod";

// Payment status types
export type PaymentStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "cancelled"
  | "refunded";

// Create Razorpay order
export async function createRazorpayOrder(orderData: {
  amount: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<any> {
  try {
    const response = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create payment order");
    }

    return data;
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
}

// Verify Razorpay payment
export async function verifyRazorpayPayment(
  verificationData: PaymentVerification,
): Promise<boolean> {
  try {
    const response = await fetch("/api/payments/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(verificationData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Payment verification failed");
    }

    return data.verified;
  } catch (error) {
    console.error("Error verifying payment:", error);
    return false;
  }
}

// Process refund
export async function processRefund(refundData: RefundRequest): Promise<any> {
  try {
    const response = await fetch("/api/payments/refund", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refundData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Refund processing failed");
    }

    return data;
  } catch (error) {
    console.error("Error processing refund:", error);
    throw error;
  }
}

// Check COD eligibility
export function isCODEligible(
  orderAmount: number,
  customerHistory?: {
    totalOrders: number;
    successfulPayments: number;
    lastOrderDate?: Date;
  },
): { eligible: boolean; reason?: string } {
  const config = DEFAULT_PAYMENT_CONFIG.cod;

  if (!config.enabled) {
    return { eligible: false, reason: "COD is currently disabled" };
  }

  if (orderAmount > config.maxAmount) {
    return {
      eligible: false,
      reason: `COD not available for orders above ₹${config.maxAmount}`,
    };
  }

  // Risk assessment for high-value orders
  if (orderAmount > config.riskThreshold) {
    if (!customerHistory) {
      return {
        eligible: false,
        reason: "COD requires customer verification for high-value orders",
      };
    }

    const successRate =
      customerHistory.successfulPayments / customerHistory.totalOrders;

    if (successRate < 0.8) {
      // Less than 80% success rate
      return {
        eligible: false,
        reason: "COD not available due to payment history",
      };
    }

    if (customerHistory.totalOrders < 3) {
      return {
        eligible: false,
        reason: "COD requires at least 3 successful orders",
      };
    }
  }

  return { eligible: true };
}

// Calculate payment processing fees
export function calculatePaymentFees(
  amount: number,
  method: PaymentMethod,
  isInternational: boolean = false,
): {
  processingFee: number;
  gst: number;
  totalFee: number;
  breakdown: string[];
} {
  let processingFee = 0;
  const breakdown: string[] = [];

  switch (method) {
    case "card":
      // 2.5% + ₹3.5 for domestic cards
      processingFee = amount * 0.025 + 3.5;
      breakdown.push(`Card processing: ${(amount * 0.025).toFixed(2)} + ₹3.50`);
      break;

    case "upi":
      // 0.3% + ₹1 for UPI
      processingFee = Math.max(amount * 0.003 + 1, 3); // Minimum ₹3
      breakdown.push(`UPI processing: ₹${processingFee.toFixed(2)}`);
      break;

    case "netbanking":
      // 2.5% + ₹2.5 for net banking
      processingFee = amount * 0.025 + 2.5;
      breakdown.push(`Net banking: ${(amount * 0.025).toFixed(2)} + ₹2.50`);
      break;

    case "wallet":
      // 1.5% + ₹2 for wallets
      processingFee = amount * 0.015 + 2;
      breakdown.push(
        `Wallet processing: ${(amount * 0.015).toFixed(2)} + ₹2.00`,
      );
      break;

    case "cod":
      // No processing fee for COD
      processingFee = 0;
      breakdown.push("COD: No processing fee");
      break;
  }

  // GST on processing fees (18%)
  const gst = processingFee * 0.18;
  const totalFee = processingFee + gst;

  if (processingFee > 0) {
    breakdown.push(`GST (18%): ₹${gst.toFixed(2)}`);
    breakdown.push(`Total fee: ₹${totalFee.toFixed(2)}`);
  }

  return {
    processingFee: Math.round(processingFee * 100) / 100,
    gst: Math.round(gst * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100,
    breakdown,
  };
}

// Generate payment receipt
export function generatePaymentReceipt(paymentData: {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  timestamp: Date;
}): string {
  const { orderId, amount, method, status, transactionId, timestamp } =
    paymentData;

  return `
PAYMENT RECEIPT
================
Order ID: ${orderId}
Amount: ₹${amount.toFixed(2)}
Payment Method: ${method.toUpperCase()}
Status: ${status.toUpperCase()}
${transactionId ? `Transaction ID: ${transactionId}` : ""}
Date: ${timestamp.toLocaleString("en-IN")}
================
Thank you for shopping with TownKart!
  `.trim();
}

// Validate payment amount
export function validatePaymentAmount(amount: number): {
  valid: boolean;
  reason?: string;
} {
  if (amount <= 0) {
    return { valid: false, reason: "Amount must be greater than 0" };
  }

  if (amount > 500000) {
    // ₹5,00,000 limit
    return { valid: false, reason: "Maximum payment amount is ₹5,00,000" };
  }

  // Check for reasonable decimal places (max 2)
  if (amount % 0.01 !== 0) {
    return { valid: false, reason: "Amount can have maximum 2 decimal places" };
  }

  return { valid: true };
}

// Get payment method display name
export function getPaymentMethodDisplayName(method: PaymentMethod): string {
  const names: Record<PaymentMethod, string> = {
    card: "Credit/Debit Card",
    upi: "UPI",
    netbanking: "Net Banking",
    wallet: "Digital Wallet",
    cod: "Cash on Delivery",
  };

  return names[method];
}

// Get payment status color
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    created: "bg-gray-500",
    authorized: "bg-yellow-500",
    captured: "bg-green-500",
    failed: "bg-red-500",
    cancelled: "bg-gray-500",
    refunded: "bg-blue-500",
  };

  return colors[status];
}

// Calculate installment options for EMI
export function calculateInstallments(
  amount: number,
  tenure: number,
  interestRate: number = 12, // Annual interest rate
): {
  monthlyPayment: number;
  totalAmount: number;
  interestAmount: number;
  breakdown: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
} {
  const monthlyRate = interestRate / 12 / 100;
  const monthlyPayment =
    (amount * (monthlyRate * Math.pow(1 + monthlyRate, tenure))) /
    (Math.pow(1 + monthlyRate, tenure) - 1);

  const breakdown = [];
  let balance = amount;

  for (let month = 1; month <= tenure; month++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance -= principal;

    breakdown.push({
      month,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100),
    });
  }

  const totalAmount = monthlyPayment * tenure;
  const interestAmount = totalAmount - amount;

  return {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    interestAmount: Math.round(interestAmount * 100) / 100,
    breakdown,
  };
}
