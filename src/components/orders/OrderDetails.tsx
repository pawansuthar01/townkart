"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  CreditCard,
  User,
  RefreshCw,
  AlertCircle,
  Star,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
    description?: string;
    primaryImage?: string;
    brand?: string;
  };
  variant?: {
    id: string;
    name: string;
    attributes?: any;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  deliveryAddress: any;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  customer: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string;
  };
  merchant: {
    id: string;
    businessName: string;
    address: string;
    phoneNumber?: string;
  };
  orderItems: OrderItem[];
  delivery?: {
    id: string;
    deliveryStatus: string;
    rider: {
      id: string;
      fullName: string;
      phoneNumber: string;
      rating: number;
    };
  };
  review?: {
    id: string;
    merchantRating?: number;
    riderRating?: number;
    comment?: string;
  };
}

interface OrderDetailsProps {
  orderId: string;
}

export function OrderDetails({ orderId }: OrderDetailsProps) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        const data = await response.json();

        if (data.success) {
          setOrder(data.order);
        } else {
          setError(data.message || "Failed to fetch order details");
        }
      } catch (err) {
        setError("Failed to fetch order details");
        console.error("Error fetching order details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "OUT_FOR_DELIVERY":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "PREPARING":
        return <Package className="h-5 w-5 text-orange-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "OUT_FOR_DELIVERY":
        return "bg-blue-100 text-blue-800";
      case "PREPARING":
        return "bg-orange-100 text-orange-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-townkart-primary mr-2" />
            <span className="text-gray-600">Loading order details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error || "Order not found"}
            </h3>
            <p className="text-gray-600 mb-4">
              We couldn't load the order details. Please try again.
            </p>
            <Link href="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl">
                Order #{order.orderNumber}
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(order.orderStatus)}>
                {getStatusIcon(order.orderStatus)}
                <span className="ml-1 capitalize">
                  {order.orderStatus.replace("_", " ").toLowerCase()}
                </span>
              </Badge>
              {(order.orderStatus === "OUT_FOR_DELIVERY" ||
                order.orderStatus === "DELIVERED") && (
                <Link href={`/orders/${order.id}/tracking`}>
                  <Button variant="outline" size="sm">
                    <Truck className="h-4 w-4 mr-2" />
                    Track Order
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  {item.product.primaryImage ? (
                    <img
                      src={item.product.primaryImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {item.product.name}
                  </h4>
                  {item.variant && (
                    <p className="text-sm text-gray-600">{item.variant.name}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₹{item.subtotal}
                  </p>
                  <p className="text-sm text-gray-600">
                    ₹{item.unitPrice} each
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Order Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery Fee:</span>
              <span>₹{order.deliveryFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>₹{order.taxAmount}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-₹{order.discountAmount}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>₹{order.finalAmount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{order.deliveryAddress.fullName}</p>
              <p className="text-gray-600">
                {order.deliveryAddress.addressLine1}
                {order.deliveryAddress.addressLine2 &&
                  `, ${order.deliveryAddress.addressLine2}`}
              </p>
              <p className="text-gray-600">
                {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                {order.deliveryAddress.pincode}
              </p>
              <p className="text-gray-600">
                {order.deliveryAddress.phoneNumber}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Merchant Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Merchant Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{order.merchant.businessName}</p>
              <p className="text-gray-600">{order.merchant.address}</p>
              {order.merchant.phoneNumber && (
                <p className="text-gray-600">{order.merchant.phoneNumber}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-semibold capitalize">
                {order.paymentMethod.replace("_", " ").toLowerCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Status</p>
              <Badge
                className={
                  order.paymentStatus === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : order.paymentStatus === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }
              >
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Partner */}
      {order.delivery && order.delivery.rider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Partner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.delivery.rider.fullName}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600">
                      {order.delivery.rider.rating}
                    </span>
                  </div>
                </div>
              </div>
              {order?.delivery.rider && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(`tel:${order?.delivery?.rider.phoneNumber}`)
                    }
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `https://wa.me/${order?.delivery?.rider.phoneNumber.replace(/\s+/g, "")}`,
                      )
                    }
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Order Placed</p>
                <p className="text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            {order.deliveredAt && (
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Order Delivered</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(order.deliveredAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Section */}
      {order.orderStatus === "DELIVERED" && !order.review && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Rate Your Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Share your feedback about this order to help us improve our
              service.
            </p>
            <Link href={`/orders/${order.id}/review`}>
              <Button>
                <Star className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Back Button */}
      <div className="flex justify-center">
        <Link href="/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>
    </div>
  );
}
