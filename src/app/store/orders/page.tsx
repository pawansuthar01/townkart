"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ShoppingCart,
  Eye,
  Edit,
  Truck,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: number;
  total: number;
  status: string;
  createdAt: string;
  deliveryAddress: string;
  specialInstructions?: string;
}

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/store/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);

    return matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "default";
      case "EN_ROUTE":
      case "RIDER_ASSIGNED":
        return "secondary";
      case "BEING_PREPARED":
      case "READY_FOR_PICKUP":
        return "outline";
      case "ORDER_PLACED":
        return "secondary";
      default:
        return "outline";
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh orders after status update
        fetchOrders();
      } else {
        console.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Orders</h1>
          <p className="text-gray-600">Manage orders for your store</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                orders.filter((o) =>
                  [
                    "BEING_PREPARED",
                    "READY_FOR_PICKUP",
                    "RIDER_ASSIGNED",
                    "EN_ROUTE",
                  ].includes(o.status),
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === "DELIVERED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === "ORDER_PLACED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by order number, customer name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ORDER_PLACED">Order Placed</SelectItem>
                <SelectItem value="BEING_PREPARED">Being Prepared</SelectItem>
                <SelectItem value="READY_FOR_PICKUP">
                  Ready for Pickup
                </SelectItem>
                <SelectItem value="RIDER_ASSIGNED">Rider Assigned</SelectItem>
                <SelectItem value="EN_ROUTE">En Route</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.customerPhone}</TableCell>
                  <TableCell>₹{order.total}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === "BEING_PREPARED" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateOrderStatus(order.id, "READY_FOR_PICKUP")
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                  {selectedOrder.status.replace("_", " ")}
                </Badge>
              </div>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {selectedOrder.customerPhone}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {selectedOrder.deliveryAddress}
                  </p>
                  {selectedOrder.specialInstructions && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">
                        Special Instructions:
                      </p>
                      <p className="text-sm text-yellow-700">
                        {selectedOrder.specialInstructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Items:</span>
                    <span className="font-medium">{selectedOrder.items}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="font-medium text-lg">
                      ₹{selectedOrder.total}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {selectedOrder.status === "ORDER_PLACED" && (
                  <>
                    <Button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, "STORE_ASSIGNED");
                        setIsOrderModalOpen(false);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Accept Order
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, "CANCELLED");
                        setIsOrderModalOpen(false);
                      }}
                      className="flex-1"
                    >
                      Decline Order
                    </Button>
                  </>
                )}
                {selectedOrder.status === "BEING_PREPARED" && (
                  <Button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, "READY_FOR_PICKUP");
                      setIsOrderModalOpen(false);
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Mark as Ready for Pickup
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
