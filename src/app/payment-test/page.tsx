"use client";

import { useState } from "react";
import {
  PaymentForm,
  PaymentMethodSelector,
} from "@/components/payment/PaymentForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  TestTube,
  ShoppingCart,
} from "lucide-react";
import { PaymentMethod } from "@/lib/paymentGateway";

export default function PaymentTestPage() {
  const [testAmount, setTestAmount] = useState(100);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePaymentSuccess = (paymentData: any) => {
    setIsProcessing(false);
    setPaymentResult(paymentData);
    setError(null);
    console.log("Payment successful:", paymentData);
  };

  const handlePaymentFailure = (errorMessage: string) => {
    setIsProcessing(false);
    setError(errorMessage);
    setPaymentResult(null);
    console.error("Payment failed:", errorMessage);
  };

  const handleTestPayment = () => {
    setIsProcessing(true);
    setPaymentResult(null);
    setError(null);

    // Simulate payment processing
    setTimeout(() => {
      if (selectedMethod === "cod") {
        handlePaymentSuccess({
          method: "cod",
          amount: testAmount,
          orderId: `TEST-${Date.now()}`,
          status: "cod_selected",
        });
      } else {
        // For demo purposes, simulate successful payment
        handlePaymentSuccess({
          method: selectedMethod,
          amount: testAmount,
          orderId: `TEST-${Date.now()}`,
          paymentId: `pay_${Date.now()}`,
          status: "captured",
        });
      }
    }, 2000);
  };

  const testScenarios = [
    {
      name: "Small Order",
      amount: 50,
      description: "Test basic payment flow",
    },
    {
      name: "Medium Order",
      amount: 500,
      description: "Test with free delivery threshold",
    },
    {
      name: "Large Order",
      amount: 2500,
      description: "Test high-value transaction",
    },
    {
      name: "COD Order",
      amount: 300,
      description: "Test cash on delivery",
      method: "cod" as PaymentMethod,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-12">
        <div className="w-full px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <TestTube className="h-16 w-16 mr-4" />
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  Payment Gateway Test
                </h1>
                <p className="text-xl text-blue-100">
                  Test and validate payment processing functionality
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Test Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Test Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="testAmount">Test Amount (₹)</Label>
                    <Input
                      id="testAmount"
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(Number(e.target.value))}
                      min="1"
                      max="10000"
                    />
                  </div>

                  <PaymentMethodSelector
                    selectedMethod={selectedMethod}
                    onMethodChange={setSelectedMethod}
                    amount={testAmount}
                  />

                  <Button
                    onClick={handleTestPayment}
                    disabled={isProcessing}
                    className="w-full townkart-gradient hover:opacity-90"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Test Payment
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Test Scenarios */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Test Scenarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {testScenarios.map((scenario, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start h-auto p-4"
                        onClick={() => {
                          setTestAmount(scenario.amount);
                          if (scenario.method) {
                            setSelectedMethod(scenario.method);
                          }
                        }}
                      >
                        <div className="text-left">
                          <div className="font-medium">{scenario.name}</div>
                          <div className="text-sm text-gray-600">
                            ₹{scenario.amount} - {scenario.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Status */}
              {(paymentResult || error) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {paymentResult ? (
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                      )}
                      {paymentResult ? "Payment Successful" : "Payment Failed"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paymentResult && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Order ID:</span>
                          <Badge variant="outline">
                            {paymentResult.orderId}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium">
                            ₹{paymentResult.amount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Method:</span>
                          <Badge>{paymentResult.method?.toUpperCase()}</Badge>
                        </div>
                        {paymentResult.paymentId && (
                          <div className="flex justify-between">
                            <span>Payment ID:</span>
                            <Badge variant="outline">
                              {paymentResult.paymentId}
                            </Badge>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge className="bg-green-500">
                            {paymentResult.status}
                          </Badge>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{error}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Payment Form Demo */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Form Demo</CardTitle>
                </CardHeader>
                <CardContent>
                  <PaymentForm
                    amount={testAmount}
                    orderId={`DEMO-${Date.now()}`}
                    customerEmail="test@example.com"
                    customerPhone="+919876543210"
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentFailure={handlePaymentFailure}
                  />
                </CardContent>
              </Card>

              {/* Test Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Environment Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">
                        Environment:
                      </span>
                      <div className="text-gray-900">Test Mode</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        Gateway:
                      </span>
                      <div className="text-gray-900">Razorpay</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        Currency:
                      </span>
                      <div className="text-gray-900">INR</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">
                        Max Amount:
                      </span>
                      <div className="text-gray-900">₹5,00,000</div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">
                      Supported Methods:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Credit Card</Badge>
                      <Badge>Debit Card</Badge>
                      <Badge>UPI</Badge>
                      <Badge>Net Banking</Badge>
                      <Badge>Digital Wallets</Badge>
                      <Badge>Cash on Delivery</Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Test Mode Notice</p>
                        <p>
                          This is a test environment. No real payments will be
                          processed. Use test card numbers and UPI IDs for
                          validation.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
