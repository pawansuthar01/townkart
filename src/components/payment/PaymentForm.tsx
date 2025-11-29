"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  Truck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Info,
} from "lucide-react";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  isCODEligible,
  calculatePaymentFees,
  getPaymentMethodDisplayName,
  PaymentMethod,
} from "@/lib/paymentGateway";

interface PaymentFormProps {
  amount: number;
  orderId: string;
  customerEmail?: string;
  customerPhone?: string;
  customerHistory?: {
    totalOrders: number;
    successfulPayments: number;
    lastOrderDate?: Date;
  };
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentFailure?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentForm({
  amount,
  orderId,
  customerEmail,
  customerPhone,
  customerHistory,
  onPaymentSuccess,
  onPaymentFailure,
}: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [codEligibility, setCodEligibility] = useState<{
    eligible: boolean;
    reason?: string;
  } | null>(null);

  // Payment methods configuration
  const paymentMethods: Array<{
    id: PaymentMethod;
    name: string;
    icon: React.ReactNode;
    description: string;
    processingFee: number;
    popular?: boolean;
  }> = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Visa, Mastercard, RuPay",
      processingFee: calculatePaymentFees(amount, "card").totalFee,
      popular: true,
    },
    {
      id: "upi",
      name: "UPI",
      icon: <Smartphone className="h-5 w-5" />,
      description: "Google Pay, PhonePe, Paytm",
      processingFee: calculatePaymentFees(amount, "upi").totalFee,
      popular: true,
    },
    {
      id: "netbanking",
      name: "Net Banking",
      icon: <Building className="h-5 w-5" />,
      description: "All major banks",
      processingFee: calculatePaymentFees(amount, "netbanking").totalFee,
    },
    {
      id: "wallet",
      name: "Digital Wallet",
      icon: <Wallet className="h-5 w-5" />,
      description: "Paytm, Mobikwik, Ola Money",
      processingFee: calculatePaymentFees(amount, "wallet").totalFee,
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      icon: <Truck className="h-5 w-5" />,
      description: "Pay when you receive",
      processingFee: 0,
    },
  ];

  // Check COD eligibility on component mount
  useEffect(() => {
    const eligibility = isCODEligible(amount, customerHistory);
    setCodEligibility(eligibility);
  }, [amount, customerHistory]);

  const handlePayment = async () => {
    if (selectedMethod === "cod") {
      // Handle COD payment
      handleCodPayment();
      return;
    }

    setIsProcessing(true);

    try {
      // Create Razorpay order
      const orderData = await createRazorpayOrder({
        amount: amount * 100, // Convert to paisa
        currency: "INR",
        receipt: orderId,
        notes: {
          orderId,
          customerEmail: customerEmail || "",
          customerPhone: customerPhone || "",
        },
      });

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TownKart",
        description: `Order #${orderId}`,
        order_id: orderData.id,
        prefill: {
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: "#f97316", // TownKart primary color
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verified = await verifyRazorpayPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verified) {
              onPaymentSuccess?.({
                ...response,
                method: selectedMethod,
                amount,
                orderId,
              });
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error: any) {
            onPaymentFailure?.(error.message);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            onPaymentFailure?.("Payment cancelled by user");
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error: any) {
      setIsProcessing(false);
      onPaymentFailure?.(error.message);
    }
  };

  const handleCodPayment = () => {
    // COD payment - just mark as successful
    onPaymentSuccess?.({
      method: "cod",
      amount,
      orderId,
      status: "cod_selected",
    });
  };

  const selectedMethodData = paymentMethods.find(
    (m) => m.id === selectedMethod,
  );

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Order Total</span>
              <span className="font-semibold">₹{amount.toFixed(2)}</span>
            </div>
            {selectedMethodData && selectedMethodData.processingFee > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processing Fee ({selectedMethod})</span>
                <span>₹{selectedMethodData.processingFee.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span>
                ₹
                {(amount + (selectedMethodData?.processingFee || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedMethod}
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
          >
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const isCod = method.id === "cod";
                const isEligible = !isCod || codEligibility?.eligible;

                return (
                  <div key={method.id} className="relative">
                    <Label
                      htmlFor={method.id}
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? "border-townkart-primary bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      } ${!isEligible ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        disabled={!isEligible}
                        className="mt-0.5"
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className={`p-2 rounded-full ${
                            selectedMethod === method.id
                              ? "bg-orange-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{method.name}</span>
                            {method.popular && (
                              <Badge className="bg-green-500 text-white text-xs">
                                Popular
                              </Badge>
                            )}
                            {method.processingFee === 0 && (
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-600"
                              >
                                Free
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {method.description}
                          </p>
                          {method.processingFee > 0 && (
                            <p className="text-xs text-gray-500">
                              Processing fee: ₹{method.processingFee.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Label>

                    {/* COD ineligibility message */}
                    {isCod && codEligibility && !codEligibility.eligible && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-700">
                            {codEligibility.reason}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-green-600" />
            <div className="text-sm">
              <p className="font-medium text-green-800">Secure Payment</p>
              <p className="text-green-700">
                Your payment information is encrypted and secure. We use
                industry-standard security measures.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pay Button */}
      <Button
        onClick={handlePayment}
        disabled={
          isProcessing ||
          (selectedMethod === "cod" && !codEligibility?.eligible)
        }
        className="w-full townkart-gradient hover:opacity-90 font-medium py-3 text-lg"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            Pay ₹
            {(amount + (selectedMethodData?.processingFee || 0)).toFixed(2)}
          </>
        )}
      </Button>

      {/* Additional Info */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          By proceeding, you agree to our{" "}
          <a href="/terms" className="text-townkart-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-townkart-primary hover:underline">
            Privacy Policy
          </a>
        </p>
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>PCI Compliant</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Quick payment method selector component
export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  amount,
  showFees = true,
}: {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  amount: number;
  showFees?: boolean;
}) {
  const methods = [
    {
      id: "card" as PaymentMethod,
      name: "Card",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      id: "upi" as PaymentMethod,
      name: "UPI",
      icon: <Smartphone className="h-4 w-4" />,
    },
    {
      id: "netbanking" as PaymentMethod,
      name: "Net Banking",
      icon: <Building className="h-4 w-4" />,
    },
    {
      id: "wallet" as PaymentMethod,
      name: "Wallet",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      id: "cod" as PaymentMethod,
      name: "COD",
      icon: <Truck className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Payment Method</Label>
      <RadioGroup
        value={selectedMethod}
        onValueChange={(value) => onMethodChange(value as PaymentMethod)}
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {methods.map((method) => {
            const fee = showFees
              ? calculatePaymentFees(amount, method.id).totalFee
              : 0;
            return (
              <Label
                key={method.id}
                htmlFor={method.id}
                className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? "border-townkart-primary bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <RadioGroupItem
                  value={method.id}
                  id={method.id}
                  className="sr-only"
                />
                <div
                  className={`p-2 rounded-full mb-2 ${
                    selectedMethod === method.id
                      ? "bg-orange-100"
                      : "bg-gray-100"
                  }`}
                >
                  {method.icon}
                </div>
                <span className="text-xs font-medium text-center">
                  {method.name}
                </span>
                {showFees && fee > 0 && (
                  <span className="text-xs text-gray-500">
                    ₹{fee.toFixed(2)}
                  </span>
                )}
                {showFees && fee === 0 && method.id === "cod" && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    Free
                  </Badge>
                )}
              </Label>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}
