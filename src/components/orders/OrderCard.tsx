"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  MapPin,
  Clock,
  Phone,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import {
  Order,
  getOrderStatusColor,
  getOrderStatusLabel,
  canCancelOrder,
  calculateCancellationRefund,
} from "@/lib/orderManagement";

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
  onCancelOrder?: (orderId: string) => void;
  onViewDetails?: (orderId: string) => void;
  compact?: boolean;
}

export function OrderCard({
  order,
  showActions = true,
  onCancelOrder,
  onViewDetails,
  compact = false,
}: OrderCardProps) {
  const statusInfo = getOrderStatusLabel(order.orderStatus as any);
  const statusColor = getOrderStatusColor(order.orderStatus as any);
  const cancelInfo = canCancelOrder(order);

  const handleCancelOrder = () => {
    if (cancelInfo.canCancel && onCancelOrder) {
      onCancelOrder(order.id);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(order.id);
    }
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  #{order.orderNumber}
                </p>
                <p className="text-sm text-gray-600">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}{" "}
                  • ₹{order.summary.total.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <Badge className={`${statusColor} text-white text-xs`}>
                {statusInfo}
              </Badge>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {showActions && (
            <div className="flex space-x-2 mt-3">
              <Button variant="outline" size="sm" onClick={handleViewDetails}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              {cancelInfo.canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelOrder}
                  className="text-red-600 hover:text-red-700"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        {/* Order Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.orderNumber}
            </h3>
            <p className="text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          <Badge className={`${statusColor} text-white`}>{statusInfo}</Badge>
        </div>

        <Separator className="my-4" />

        {/* Order Items */}
        <div className="space-y-3 mb-4">
          {order.items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                {item.images && item.images[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.productName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-600">
                  Qty: {item.quantity} × ₹{item.unitPrice.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  ₹{item.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          {order.items.length > 2 && (
            <p className="text-sm text-gray-600 text-center">
              +{order.items.length - 2} more item
              {order.items.length - 2 !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <Separator className="my-4" />

        {/* Delivery Address */}
        <div className="flex items-start space-x-3 mb-4">
          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Delivery Address
            </p>
            <p className="text-sm text-gray-600">
              {order.address.fullName}, {order.address.addressLine1}
              {order.address.addressLine2 && `, ${order.address.addressLine2}`}
              <br />
              {order.address.city}, {order.address.state} -{" "}
              {order.address.pincode}
            </p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Phone className="h-3 w-3" />
                <span>{order.address.phoneNumber}</span>
              </div>
              {order.deliveryTime && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{order.deliveryTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Order Summary */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{order.summary.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Charge</span>
            <span>₹{order.summary.deliveryCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span>₹{order.summary.tax.toFixed(2)}</span>
          </div>
          {order.summary.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-₹{order.summary.discount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{order.summary.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="flex items-center space-x-2 mb-4">
          <CreditCard className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            Paid via {order.paymentMethod.toUpperCase()}
          </span>
          <Badge
            variant={order.paymentStatus === "paid" ? "default" : "secondary"}
            className="text-xs"
          >
            {order.paymentStatus}
          </Badge>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleViewDetails}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>

            {cancelInfo.canCancel ? (
              <Button
                variant="outline"
                onClick={handleCancelOrder}
                className="flex-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Order
              </Button>
            ) : (
              <Button variant="outline" disabled className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                {order.orderStatus === "delivered"
                  ? "Delivered"
                  : "In Progress"}
              </Button>
            )}
          </div>
        )}

        {/* Cancellation Info */}
        {!cancelInfo.canCancel && cancelInfo.reason && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-600">{cancelInfo.reason}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Order status timeline component
export function OrderStatusTimeline({ order }: { order: Order }) {
  const statuses = Object.keys(getOrderStatusLabel) as any[];
  const currentStatusIndex = statuses.indexOf(order.orderStatus);

  return (
    <div className="space-y-3">
      {statuses.map((status, index) => {
        const isCompleted = index <= currentStatusIndex;
        const isCurrent = index === currentStatusIndex;
        const statusLabel = getOrderStatusLabel(status);
        const statusColor = getOrderStatusColor(status);

        return (
          <div key={status} className="flex items-center space-x-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted
                  ? statusColor
                  : isCurrent
                    ? "bg-blue-100 border-2 border-blue-500"
                    : "bg-gray-100"
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4 text-white" />
              ) : (
                <div
                  className={`w-3 h-3 rounded-full ${
                    isCurrent ? "bg-blue-500" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  isCompleted || isCurrent ? "text-gray-900" : "text-gray-500"
                }`}
              >
                {statusLabel}
              </p>
              {isCurrent && (
                <p className="text-xs text-gray-500">Current status</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
