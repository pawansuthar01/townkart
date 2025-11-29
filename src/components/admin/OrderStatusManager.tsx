"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Package,
  Truck,
  XCircle,
} from "lucide-react";
import {
  OrderStatus,
  OrderEvent,
  orderStatusManager,
  ORDER_STATUS_CONFIG,
  getStatusColor,
  getStatusLabel,
  getStatusIcon,
  isTerminalStatus,
  canCancelOrder,
  requiresAction,
} from "@/lib/orderStatusManagement";

interface OrderSummary {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  merchantName: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export function OrderStatusManager() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [orderEvents, setOrderEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [statusNotes, setStatusNotes] = useState("");
  const [stats, setStats] = useState<Record<OrderStatus, number>>({
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready_for_pickup: 0,
    picked_up: 0,
    in_transit: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    failed: 0,
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockOrders: OrderSummary[] = [
      {
        id: "1",
        orderId: "ORD001",
        customerName: "Priya Sharma",
        customerPhone: "+91-9876543210",
        merchantName: "Fresh Mart",
        status: "in_transit",
        totalAmount: 450,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        items: [
          { name: "Organic Tomatoes", quantity: 2, price: 80 },
          { name: "Fresh Milk", quantity: 1, price: 60 },
          { name: "Whole Wheat Bread", quantity: 1, price: 40 },
        ],
      },
      {
        id: "2",
        orderId: "ORD002",
        customerName: "Rahul Kumar",
        customerPhone: "+91-9876543211",
        merchantName: "Grocery Hub",
        status: "preparing",
        totalAmount: 320,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 15 * 60 * 1000),
        items: [
          { name: "Rice (5kg)", quantity: 1, price: 250 },
          { name: "Cooking Oil", quantity: 1, price: 70 },
        ],
      },
      {
        id: "3",
        orderId: "ORD003",
        customerName: "Sneha Patel",
        customerPhone: "+91-9876543212",
        merchantName: "Daily Essentials",
        status: "delivered",
        totalAmount: 180,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        items: [
          { name: "Bananas", quantity: 6, price: 60 },
          { name: "Apples", quantity: 4, price: 120 },
        ],
      },
      {
        id: "4",
        orderId: "ORD004",
        customerName: "Amit Singh",
        customerPhone: "+91-9876543213",
        merchantName: "Fresh Mart",
        status: "cancelled",
        totalAmount: 275,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        items: [
          { name: "Chicken Breast", quantity: 1, price: 200 },
          { name: "Onions", quantity: 2, price: 75 },
        ],
      },
    ];

    setOrders(mockOrders);
    setFilteredOrders(mockOrders);

    // Calculate stats
    const statusCounts = orderStatusManager.getStatusStats();
    setStats(statusCounts);

    setLoading(false);
  }, []);

  // Filter orders based on search and status
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.merchantName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    if (!newStatus) return;

    try {
      const result = await orderStatusManager.transitionStatus(
        orderId,
        newStatus,
        {
          id: "admin",
          type: "admin",
          name: "Admin User",
        },
        {},
        statusNotes,
      );

      if (result.success) {
        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId
              ? { ...order, status: newStatus, updatedAt: new Date() }
              : order,
          ),
        );

        // Update stats
        setStats(orderStatusManager.getStatusStats());

        // Reset dialog
        setShowStatusDialog(false);
        setNewStatus("");
        setStatusNotes("");
        setSelectedOrder(null);
      } else {
        alert(`Failed to update status: ${result.errors.join(", ")}`);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  const viewOrderDetails = (order: OrderSummary) => {
    setSelectedOrder(order);
    const events = orderStatusManager.getOrderEvents(order.orderId);
    setOrderEvents(events);
  };

  const getStatusStats = () => {
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    const active =
      stats.pending +
      stats.confirmed +
      stats.preparing +
      stats.ready_for_pickup +
      stats.picked_up +
      stats.in_transit;
    const completed = stats.delivered;
    const cancelled = stats.cancelled + stats.refunded;

    return { total, active, completed, cancelled };
  };

  const statusStats = getStatusStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Order Status Management
          </h2>
          <p className="text-gray-600">
            Monitor and manage all order statuses and transitions
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusStats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusStats.active}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusStats.completed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statusStats.cancelled}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats).map(([status, count]) => {
              const config = ORDER_STATUS_CONFIG[status as OrderStatus];
              return (
                <div key={status} className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${config.color} text-white mb-2`}
                  >
                    <span className="text-lg">{config.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {config.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList>
          <TabsTrigger value="orders">All Orders</TabsTrigger>
          <TabsTrigger value="timeline">Order Timeline</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by order ID, customer, or merchant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready_for_pickup">
                      Ready for Pickup
                    </SelectItem>
                    <SelectItem value="picked_up">Picked Up</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
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
                    <TableHead>Merchant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const config = ORDER_STATUS_CONFIG[order.status];
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-gray-600">
                              {order.customerPhone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{order.merchantName}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.color} text-white`}>
                            {config.icon} {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{order.totalAmount}</TableCell>
                        <TableCell>
                          {order.createdAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => viewOrderDetails(order)}
                              >
                                View Details
                              </DropdownMenuItem>
                              {!isTerminalStatus(order.status) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setShowStatusDialog(true);
                                  }}
                                >
                                  Update Status
                                </DropdownMenuItem>
                              )}
                              {canCancelOrder(order.status) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      order.orderId,
                                      "cancelled",
                                    )
                                  }
                                  className="text-red-600"
                                >
                                  Cancel Order
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No orders found matching your criteria
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <CardTitle>Order Timeline - {selectedOrder.orderId}</CardTitle>
                <p className="text-sm text-gray-600">
                  Customer: {selectedOrder.customerName} | Total: ₹
                  {selectedOrder.totalAmount}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderEvents.length > 0 ? (
                    orderEvents.map((event, index) => {
                      const config = ORDER_STATUS_CONFIG[event.status];
                      return (
                        <div key={event.id} className="flex items-start gap-4">
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white`}
                          >
                            <span>{config.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900">
                                {config.label}
                              </h4>
                              <span className="text-sm text-gray-500">
                                {event.timestamp.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {config.description}
                            </p>
                            {event.notes && (
                              <p className="text-sm text-gray-600 mt-1 italic">
                                "{event.notes}"
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              by {event.actor.name} ({event.actor.type})
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No timeline events found for this order
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Select an order to view its timeline
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">Order: {selectedOrder.orderId}</p>
                <p className="text-sm text-gray-600">
                  Current Status:{" "}
                  {ORDER_STATUS_CONFIG[selectedOrder.status].label}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  New Status
                </label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as OrderStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatusManager
                      .getAllowedTransitions(selectedOrder.status)
                      .map((status) => {
                        const config = ORDER_STATUS_CONFIG[status];
                        return (
                          <SelectItem key={status} value={status}>
                            {config.icon} {config.label}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes (Optional)
                </label>
                <Textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add notes about this status change..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowStatusDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleStatusChange(
                      selectedOrder.orderId,
                      newStatus as OrderStatus,
                    )
                  }
                  disabled={!newStatus}
                >
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
