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
  RefreshCw,
} from "lucide-react";

interface Order {
  id: string;
  customer: string;
  store: string;
  total: number;
  status: string;
  paymentStatus: string;
  date: string;
  items: number;
}

interface OrderStats {
  totalOrders: number;
  delivered: number;
  inTransit: number;
  pendingPayment: number;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    delivered: 0,
    inTransit: 0,
    pendingPayment: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (paymentFilter !== "ALL")
        params.append("paymentStatus", paymentFilter);

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
          setStats(data.stats);
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
  }, [statusFilter, paymentFilter]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.store.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "default";
      case "IN_TRANSIT":
        return "secondary";
      case "PREPARING":
        return "outline";
      case "ORDER_PLACED":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getPaymentBadgeVariant = (status: string) => {
    return status === "COMPLETED" ? "default" : "destructive";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Monitor and manage all orders</p>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payment
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayment}</div>
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
                  placeholder="Search by order ID, customer, or store..."
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
                <SelectItem value="PREPARING">Preparing</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
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
                <TableHead>Store</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.store}</TableCell>
                  <TableCell>₹{order.total}</TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getPaymentBadgeVariant(order.paymentStatus)}
                    >
                      {order.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
