"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import {
  MapPin,
  CreditCard,
  Truck,
  Clock,
  Shield,
  Plus,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Gift,
  Tag,
  X,
} from "lucide-react";

interface Address {
  id: string;
  type: "home" | "work" | "other";
  name: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: "card" | "upi" | "wallet" | "cod";
  name: string;
  details?: string;
  icon: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items, getCartSummary, validateCart, clearAllItems } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"address" | "payment" | "review">("address");

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: "home" as "home" | "work" | "other",
    name: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Payment state
  const [paymentMethods] = useState<PaymentMethod[]>([
    { id: "cod", type: "cod", name: "Cash on Delivery", icon: "💵" },
    { id: "card", type: "card", name: "Credit/Debit Card", icon: "💳" },
    { id: "upi", type: "upi", name: "UPI Payment", icon: "📱" },
    { id: "wallet", type: "wallet", name: "Digital Wallet", icon: "👛" },
  ]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("cod");

  // Order state
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [orderError, setOrderError] = useState<{
    message: string;
    type?: string;
  } | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const cartSummary = getCartSummary();
  const cartValidation = validateCart();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/checkout");
      return;
    }
  }, [isAuthenticated, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
      return;
    }
  }, [items, router]);

  // Load user addresses
  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await fetch("/api/users/addresses");
        if (response.ok) {
          const data = await response.json();
          setAddresses(data.addresses || []);
          // Set default address if available
          const defaultAddr = data.addresses?.find(
            (addr: Address) => addr.isDefault
          );
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
          }
        }
      } catch (error) {
        console.error("Failed to load addresses:", error);
      }
    };

    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  const handleAddNewAddress = async () => {
    if (!newAddress.line1 || !newAddress.city || !newAddress.pincode) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/users/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses((prev) => [...prev, data.address]);
        setSelectedAddressId(data.address.id);
        setShowNewAddressForm(false);
        setNewAddress({
          type: "home",
          name: "",
          line1: "",
          line2: "",
          landmark: "",
          city: "",
          state: "",
          pincode: "",
        });
      } else {
        alert("Failed to add address");
      }
    } catch (error) {
      console.error("Failed to add address:", error);
      alert("Failed to add address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }

    if (!agreeToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    if (!cartValidation.isValid) {
      alert("Some items in your cart are no longer available");
      return;
    }

    setIsLoading(true);

    try {
      const selectedAddress = addresses.find(
        (addr) => addr.id === selectedAddressId
      );

      if (!selectedAddress) {
        alert("Selected address not found");
        return;
      }

      // Transform cart items to order items format
      const orderItems = items.map((item) => ({
        productId: item.id, // This should be the actual product ID from cart
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      }));

      // Transform address to match API expectations
      const orderAddress = {
        fullName: user?.name || "Customer",
        phoneNumber: (user as any)?.phoneNumber || user?.phoneNumber || "",
        email: user?.email || "",
        addressLine1: selectedAddress.line1,
        addressLine2: selectedAddress.line2 || "",
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        landmark: selectedAddress.landmark || "",
        type: selectedAddress.type,
      };

      // Map payment methods to enum values
      const paymentMethodMap: { [key: string]: string } = {
        cod: "CASH_ON_DELIVERY",
        card: "CARD",
        upi: "UPI",
        wallet: "WALLET",
      };

      const orderData = {
        customerId: user?.id,
        items: orderItems,
        address: orderAddress,
        paymentMethod:
          paymentMethodMap[selectedPaymentMethod] || "CASH_ON_DELIVERY",
        deliveryCharge: cartSummary.deliveryFee,
        discount: couponDiscount,
        couponCode: appliedCoupon,
        specialInstructions,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const data = await response.json();
        clearAllItems();
        router.push(`/orders/${data.id}`);
      } else {
        const error = await response.json();
        setOrderError({
          message: error.message || "Failed to place order",
          type: error.type,
        });
      }
    } catch (error) {
      console.error("Failed to place order:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAddress = addresses.find(
    (addr) => addr.id === selectedAddressId
  );

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">
            Add some items to your cart before checkout
          </p>
          <Link href="/">
            <Button>Start Shopping</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to Cart Button - Mobile First */}
      <div className="bg-white border-b px-4 py-3 md:hidden">
        <Link href="/cart">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps - Mobile First */}
          <div className="mb-6 md:mb-8">
            {/* Mobile: Horizontal scrollable steps */}
            <div className="md:hidden overflow-x-auto pb-2">
              <div className="flex items-center justify-start space-x-4 min-w-max px-2">
                {[
                  { key: "address", label: "Address", icon: MapPin },
                  { key: "payment", label: "Payment", icon: CreditCard },
                  { key: "review", label: "Review", icon: CheckCircle },
                ].map(({ key, label, icon: Icon }, index) => (
                  <div
                    key={key}
                    className="flex flex-col items-center space-y-1 min-w-0"
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-xs ${
                        step === key
                          ? "bg-townkart-primary text-white"
                          : ["address", "payment", "review"].indexOf(step) >
                              index
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-xs font-medium text-center ${
                        step === key ? "text-townkart-primary" : "text-gray-600"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Centered steps */}
            <div className="hidden md:flex items-center justify-center space-x-8">
              {[
                { key: "address", label: "Address", icon: MapPin },
                { key: "payment", label: "Payment", icon: CreditCard },
                { key: "review", label: "Review", icon: CheckCircle },
              ].map(({ key, label, icon: Icon }, index) => (
                <div key={key} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      step === key
                        ? "bg-townkart-primary text-white"
                        : ["address", "payment", "review"].indexOf(step) > index
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`ml-2 font-medium ${
                      step === key ? "text-townkart-primary" : "text-gray-600"
                    }`}
                  >
                    {label}
                  </span>
                  {index < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-4" />}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Address Step */}
              {step === "address" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5" />
                      <span>Delivery Address</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Existing Addresses */}
                    {addresses.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-base font-medium">
                          Select Address
                        </Label>
                        <RadioGroup
                          value={selectedAddressId}
                          onValueChange={setSelectedAddressId}
                        >
                          {addresses.map((address) => (
                            <div
                              key={address.id}
                              className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50"
                            >
                              <RadioGroupItem
                                value={address.id}
                                id={address.id}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={address.id}
                                  className="font-medium cursor-pointer"
                                >
                                  {address.name}{" "}
                                  {address.isDefault && (
                                    <Badge variant="secondary" className="ml-2">
                                      Default
                                    </Badge>
                                  )}
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">
                                  {address.line1}
                                  {address.line2 && `, ${address.line2}`}
                                  {address.landmark && `, ${address.landmark}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {address.city}, {address.state} -{" "}
                                  {address.pincode}
                                </p>
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )}

                    {/* Add New Address */}
                    <div className="pt-4 border-t">
                      {!showNewAddressForm ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowNewAddressForm(true)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Address
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">
                              Add New Address
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowNewAddressForm(false)}
                            >
                              Cancel
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="address-name">Address Name</Label>
                              <Input
                                id="address-name"
                                placeholder="e.g., Home, Office"
                                value={newAddress.name}
                                onChange={(e) =>
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="address-type">Type</Label>
                              <select
                                id="address-type"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                value={newAddress.type}
                                onChange={(e) =>
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    type: e.target.value as any,
                                  }))
                                }
                              >
                                <option value="home">Home</option>
                                <option value="work">Work</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="address-line1">
                              Address Line 1 *
                            </Label>
                            <Input
                              id="address-line1"
                              placeholder="Street address, building name"
                              value={newAddress.line1}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  line1: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="address-line2">
                              Address Line 2
                            </Label>
                            <Input
                              id="address-line2"
                              placeholder="Apartment, suite, etc."
                              value={newAddress.line2}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  line2: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <Label htmlFor="landmark">Landmark</Label>
                            <Input
                              id="landmark"
                              placeholder="Near landmark"
                              value={newAddress.landmark}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  landmark: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="city">City *</Label>
                              <Input
                                id="city"
                                placeholder="City"
                                value={newAddress.city}
                                onChange={(e) =>
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    city: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="state">State *</Label>
                              <Input
                                id="state"
                                placeholder="State"
                                value={newAddress.state}
                                onChange={(e) =>
                                  setNewAddress((prev) => ({
                                    ...prev,
                                    state: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="pincode">Pincode *</Label>
                            <Input
                              id="pincode"
                              placeholder="6-digit pincode"
                              value={newAddress.pincode}
                              onChange={(e) =>
                                setNewAddress((prev) => ({
                                  ...prev,
                                  pincode: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <Button
                            onClick={handleAddNewAddress}
                            className="w-full"
                          >
                            Add Address
                          </Button>
                        </div>
                      )}
                    </div>

                    {selectedAddressId && (
                      <div className="pt-4">
                        <Button
                          onClick={() => setStep("payment")}
                          className="w-full btn-primary"
                          size="lg"
                        >
                          Continue to Payment
                          <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payment Step */}
              {step === "payment" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Payment Method</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup
                      value={selectedPaymentMethod}
                      onValueChange={setSelectedPaymentMethod}
                    >
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className="flex items-center space-x-3 flex-1">
                            <span className="text-2xl">{method.icon}</span>
                            <div>
                              <Label
                                htmlFor={method.id}
                                className="font-medium cursor-pointer"
                              >
                                {method.name}
                              </Label>
                              {method.details && (
                                <p className="text-sm text-gray-600">
                                  {method.details}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>

                    <div className="flex space-x-4 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep("address")}
                        className="flex-1"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={() => setStep("review")}
                        className="flex-1 btn-primary"
                      >
                        Review Order
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Review Step */}
              {step === "review" && (
                <div className="space-y-6">
                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-4"
                          >
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-2xl">📦</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-gray-600">
                                {item.shop}
                              </p>
                              <p className="text-sm">
                                Qty: {item.quantity} × ₹{item.price}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                ₹{item.price * item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5" />
                        <span>Delivery Address</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedAddress && (
                        <div>
                          <p className="font-medium">{selectedAddress.name}</p>
                          <p className="text-gray-600">
                            {selectedAddress.line1}
                            {selectedAddress.line2 &&
                              `, ${selectedAddress.line2}`}
                          </p>
                          <p className="text-gray-600">
                            {selectedAddress.city}, {selectedAddress.state} -{" "}
                            {selectedAddress.pincode}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Special Instructions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Special Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        placeholder="Any special delivery instructions..."
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                      />
                    </CardContent>
                  </Card>

                  {/* Terms and Conditions */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms"
                          checked={agreeToTerms}
                          onCheckedChange={(checked) =>
                            setAgreeToTerms(checked as boolean)
                          }
                        />
                        <Label htmlFor="terms" className="text-sm">
                          I agree to the{" "}
                          <Link
                            href="/terms"
                            className="text-townkart-primary hover:underline"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/privacy"
                            className="text-townkart-primary hover:underline"
                          >
                            Privacy Policy
                          </Link>
                        </Label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Error Message */}
                  {orderError && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {orderError.type === "SERVICE_AREA_UNAVAILABLE" ? (
                          <div className="space-y-2">
                            <p className="font-medium">{orderError.message}</p>
                            <p className="text-sm">
                              We're expanding our services to your area. Stay
                              tuned for updates!
                            </p>
                          </div>
                        ) : (
                          <p>{orderError.message}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("payment")}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={() => {
                        setOrderError(null); // Clear previous error
                        handlePlaceOrder();
                      }}
                      disabled={!agreeToTerms || isLoading}
                      className="flex-1 btn-primary"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          Place Order
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-4 md:space-y-6">
              <Card className="md:sticky md:top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coupon Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        Have a coupon?
                      </span>
                    </div>
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-townkart-primary focus:border-transparent"
                        />
                        <button
                          onClick={async () => {
                            if (couponCode) {
                              try {
                                const response = await fetch(
                                  "/api/coupons/validate",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      couponCode,
                                      cartTotal: cartSummary.subtotal,
                                      userId: user?.id,
                                    }),
                                  }
                                );

                                const data = await response.json();

                                if (data.success) {
                                  setAppliedCoupon(data.data.couponCode);
                                  setCouponDiscount(data.data.discount);
                                } else {
                                  alert(data.message || "Invalid coupon code");
                                }
                              } catch (error) {
                                console.error(
                                  "Coupon validation error:",
                                  error
                                );
                                alert(
                                  "Failed to validate coupon. Please try again."
                                );
                              }
                            }
                          }}
                          disabled={!couponCode}
                          className="px-4 py-2 bg-townkart-primary text-white text-sm font-medium rounded-md hover:bg-townkart-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Apply
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {appliedCoupon} applied
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponDiscount(0);
                            setCouponCode("");
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({items.length} items)</span>
                      <span>₹{cartSummary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee</span>
                      <span
                        className={
                          cartSummary.isFreeDelivery ? "text-green-600" : ""
                        }
                      >
                        {cartSummary.isFreeDelivery
                          ? "FREE"
                          : `₹${cartSummary.deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (5%)</span>
                      <span>₹{cartSummary.tax.toFixed(2)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Coupon Discount</span>
                        <span>-₹{couponDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>
                        ₹{(cartSummary.total - couponDiscount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-blue-800">
                      <Truck className="h-4 w-4" />
                      <span>Estimated delivery: 30-60 minutes</span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Secure checkout</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span>Real-time tracking</span>
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
