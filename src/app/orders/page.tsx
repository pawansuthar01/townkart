"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Eye,
  Calendar,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Order {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount: number;
  finalAmount: number;
  createdAt: string;
  deliveredAt?: string;
  merchant: {
    id: string;
    businessName: string;
    address: string;
  };
  orderItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: {
      id: string;
      name: string;
      primaryImage?: string;
    };
  }>;
  delivery?: {
    id: string;
    deliveryStatus: string;
  };
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch orders
  const fetchOrders = async (page = 1) => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        customerId: user.id,
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
      });

      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/orders?${params}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setPagination(data.pagination);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      setError("Failed to fetch orders");
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id, searchQuery, statusFilter, sortBy]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "OUT_FOR_DELIVERY":
        return <Truck className="h-4 w-4 text-blue-600" />;
      case "PREPARING":
        return <Package className="h-4 w-4 text-orange-600" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Please log in to view your orders
            </h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to access your order history.
            </p>
            <Link href="/auth/login">
              <Button>Log In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-townkart-primary" />
          <span className="ml-2 text-gray-600">Loading your orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error loading orders
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white py-12">
        <div className="w-full px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">My Orders</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Track and manage all your orders in one place
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-6 px-4 bg-white border-b">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search orders by ID or merchant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="PENDING_CONFIRMATION">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="PREPARING">Preparing</SelectItem>
                  <SelectItem value="READY_FOR_PICKUP">
                    Ready for Pickup
                  </SelectItem>
                  <SelectItem value="OUT_FOR_DELIVERY">
                    Out for Delivery
                  </SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount-high">
                    Amount: High to Low
                  </SelectItem>
                  <SelectItem value="amount-low">
                    Amount: Low to High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Orders List */}
      <section className="py-8">
        <div className="container-max">
          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {orders.length} of {pagination.total} orders
            </p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No orders found
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't placed any orders yet. Start shopping to see your
                orders here.
              </p>
              <Link href="/products">
                <Button>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.orderNumber}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {order.merchant.businessName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(order.orderStatus)}>
                          {getStatusIcon(order.orderStatus)}
                          <span className="ml-1 capitalize">
                            {order.orderStatus.replace("_", " ").toLowerCase()}
                          </span>
                        </Badge>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ₹{order.finalAmount}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.orderItems.length} item
                            {order.orderItems.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {/* Order Items Preview */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          {order.orderItems.slice(0, 3).map((item, index) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2"
                            >
                              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                {item.product.primaryImage ? (
                                  <img
                                    src={item.product.primaryImage}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <Package className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              {index === 2 && order.orderItems.length > 3 && (
                                <span className="text-sm text-gray-600">
                                  +{order.orderItems.length - 3} more
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">
                          {order.orderItems[0]?.product.name}
                          {order.orderItems.length > 1 &&
                            ` and ${order.orderItems.length - 1} other item${order.orderItems.length > 2 ? "s" : ""}`}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {orders.length > 0 && pagination.page < pagination.totalPages && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                className="px-8"
                onClick={() => fetchOrders(pagination.page + 1)}
              >
                Load More Orders
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
