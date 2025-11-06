"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  MapPin,
  Phone,
  Truck,
  CheckCircle,
  XCircle,
  RefreshCw,
  Package,
  Star,
  MessageSquare,
} from "lucide-react";

interface OrderCardProps {
  order: {
    id: string;
    status:
      | "pending"
      | "confirmed"
      | "preparing"
      | "ready"
      | "picked_up"
      | "delivered"
      | "cancelled";
    items: Array<{
      id: number;
      name: string;
      image: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    deliveryFee: number;
    tax: number;
    shop: {
      name: string;
      image: string;
      phone: string;
    };
    deliveryAddress: string;
    estimatedDelivery: string;
    orderedAt: string;
    rider?: {
      name: string;
      phone: string;
      rating: number;
    };
    canRate?: boolean;
    canReorder?: boolean;
  };
  compact?: boolean;
  showActions?: boolean;
}

const statusConfig = {
  pending: {
    label: "Order Placed",
    color: "bg-yellow-500",
    icon: Clock,
    textColor: "text-yellow-700",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-500",
    icon: CheckCircle,
    textColor: "text-blue-700",
  },
  preparing: {
    label: "Preparing",
    color: "bg-orange-500",
    icon: RefreshCw,
    textColor: "text-orange-700",
  },
  ready: {
    label: "Ready for Pickup",
    color: "bg-purple-500",
    icon: Package,
    textColor: "text-purple-700",
  },
  picked_up: {
    label: "Picked Up",
    color: "bg-indigo-500",
    icon: Truck,
    textColor: "text-indigo-700",
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-500",
    icon: CheckCircle,
    textColor: "text-green-700",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500",
    icon: XCircle,
    textColor: "text-red-700",
  },
};

export function OrderCard({
  order,
  compact = false,
  showActions = true,
}: OrderCardProps) {
  const statusInfo = statusConfig[order.status];

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={order.shop.image}
                  alt={order.shop.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{order.shop.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(order.orderedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="text-right">
              <Badge className={`${statusInfo.color} text-white border-0`}>
                {statusInfo.label}
              </Badge>
              <p className="text-sm font-medium text-gray-900 mt-1">
                ₹{order.total}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {order.items.length} item{order.items.length > 1 ? "s" : ""}
            </p>
            <Link href={`/orders/${order.id}`}>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden">
              <Image
                src={order.shop.image}
                alt={order.shop.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <CardTitle className="text-lg">{order.shop.name}</CardTitle>
              <p className="text-sm text-gray-500">
                Order #{order.id} •{" "}
                {new Date(order.orderedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Badge
            className={`${statusInfo.color} text-white border-0 text-sm px-3 py-1`}
          >
            <statusInfo.icon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Items */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Qty: {item.quantity} • ₹{item.price} each
                  </p>
                </div>
                <p className="font-medium text-gray-900">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Order Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{order.total - order.deliveryFee - order.tax}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delivery Fee</span>
            <span>₹{order.deliveryFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span>₹{order.tax}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>₹{order.total}</span>
          </div>
        </div>

        {/* Delivery Info */}
        {(order.status === "picked_up" || order.status === "delivered") &&
          order.rider && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Delivery Partner
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-townkart-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {order.rider.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.rider.name}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">
                          {order.rider.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
            </>
          )}

        {/* Delivery Address */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{order.deliveryAddress}</span>
          </div>
        </div>

        {/* Estimated Delivery */}
        {order.status !== "delivered" && order.status !== "cancelled" && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                Estimated delivery: {order.estimatedDelivery}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex flex-wrap gap-3 pt-4">
            <Link href={`/orders/${order.id}`}>
              <Button variant="outline">Track Order</Button>
            </Link>

            {order.canRate && (
              <Button variant="outline">
                <Star className="h-4 w-4 mr-2" />
                Rate Order
              </Button>
            )}

            {order.canReorder && (
              <Button className="townkart-gradient hover:opacity-90">
                Reorder
              </Button>
            )}

            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Support
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
