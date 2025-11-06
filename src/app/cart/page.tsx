"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useCart } from "@/hooks/useCart";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Truck,
  Shield,
  CreditCard,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

export default function CartPage() {
  const {
    items,
    itemCount,
    addItem,
    removeItem,
    updateItemQuantity,
    clearAllItems,
    getCartSummary,
    validateCart,
  } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const cartSummary = getCartSummary();
  const cartValidation = validateCart();

  const handleQuantityChange = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateItemQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (!cartValidation.isValid) {
      alert(
        "Some items in your cart are no longer available. Please remove them and try again.",
      );
      return;
    }

    setIsLoading(true);
    // Redirect to checkout
    window.location.href = "/checkout";
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <EmptyState
            icon={<ShoppingCart className="h-12 w-12" />}
            title="Your cart is empty"
            description="Add some delicious items from your favorite local shops"
            action={{
              label: "Start Shopping",
              onClick: () => (window.location.href = "/"),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="townkart-gradient p-2 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">TownKart</span>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Shopping Cart
            </h1>
            <p className="text-gray-600">
              {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {!cartValidation.isValid && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-red-800">
                    <Shield className="h-5 w-5" />
                    <span className="font-medium">Cart Updated</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    Some items in your cart are no longer available. Please
                    review and update your cart.
                  </p>
                </div>
              )}

              {items.map((item: any) => {
                const isOutOfStock = item.quantity > item.stock;
                const maxQuantity = Math.min(item.stock, 10); // Max 10 items per product

                return (
                  <Card
                    key={item.id}
                    className={`overflow-hidden ${isOutOfStock ? "border-red-200 bg-red-50" : ""}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        {/* Product Image */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                {item.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.shop}
                              </p>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-lg font-bold text-gray-900">
                                  ₹{item.price}
                                </span>
                                {isOutOfStock && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Out of Stock
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity - 1,
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleQuantityChange(
                                    item.id,
                                    item.quantity + 1,
                                  )
                                }
                                disabled={
                                  item.quantity >= maxQuantity || isOutOfStock
                                }
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Item Total */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <span className="text-sm text-gray-600">
                              Subtotal: ₹{item.price * item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Clear Cart */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearAllItems}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Order Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({itemCount} items)</span>
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

                    {!cartSummary.isFreeDelivery && (
                      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                        Add ₹
                        {(
                          cartSummary.freeDeliveryThreshold -
                          cartSummary.subtotal
                        ).toFixed(2)}{" "}
                        more for free delivery
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>₹{cartSummary.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full btn-primary"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={!cartValidation.isValid || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Checkout
                        <Truck className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <Link href="/">
                      <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span>Secure checkout with SSL encryption</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Truck className="h-5 w-5 text-blue-600" />
                      <span>Fast delivery within 30-60 minutes</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                      <span>Multiple payment options available</span>
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
