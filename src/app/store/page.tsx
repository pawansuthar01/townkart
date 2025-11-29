"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Phone,
  RefreshCw,
} from "lucide-react";

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

export default function StoreDashboard() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [historicalOrders, setHistoricalOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/store/orders");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Categorize orders
            const active: Order[] = [];
            const newOrders: Order[] = [];
            const historical: Order[] = [];

            data.orders.forEach((order: Order) => {
              const orderTime = new Date(order.createdAt);
              const now = new Date();
              const minutesAgo =
                (now.getTime() - orderTime.getTime()) / (1000 * 60);

              if (
                [
                  "BEING_PREPARED",
                  "READY_FOR_PICKUP",
                  "RIDER_ASSIGNED",
                  "EN_ROUTE",
                ].includes(order.status)
              ) {
                active.push(order);
              } else if (order.status === "ORDER_PLACED" && minutesAgo < 30) {
                newOrders.push(order);
              } else {
                historical.push(order);
              }
            });

            setActiveOrders(active);
            setNewOrders(newOrders);
            setHistoricalOrders(historical);
          }
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        // Clear orders on error
        setActiveOrders([]);
        setNewOrders([]);
        setHistoricalOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();

    // Set up polling for real-time updates (can be replaced with WebSocket)
    const interval = setInterval(fetchOrders, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ORDER_PLACED":
        return "bg-yellow-500";
      case "STORE_ASSIGNED":
        return "bg-blue-500";
      case "BEING_PREPARED":
        return "bg-orange-500";
      case "READY_FOR_PICKUP":
        return "bg-purple-500";
      case "RIDER_ASSIGNED":
        return "bg-indigo-500";
      case "EN_ROUTE":
        return "bg-cyan-500";
      case "DELIVERED":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ORDER_PLACED":
        return "Order Placed";
      case "STORE_ASSIGNED":
        return "Store Assigned";
      case "BEING_PREPARED":
        return "Being Prepared";
      case "READY_FOR_PICKUP":
        return "Ready for Pickup";
      case "RIDER_ASSIGNED":
        return "Rider Assigned";
      case "EN_ROUTE":
        return "En Route";
      case "DELIVERED":
        return "Delivered";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
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
        window.location.reload();
      } else {
        console.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const OrderCard = ({
    order,
    showActions = false,
  }: {
    order: Order;
    showActions?: boolean;
  }) => (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">
              {order.customerName}
            </h3>
            <p className="text-sm text-gray-600">{order.orderNumber}</p>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white`}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center text-sm text-gray-600">
            <Package className="h-4 w-4 mr-2" />
            {order.items} items • ₹{order.total}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            {order.customerPhone}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {order.deliveryAddress}
          </div>
          {order.specialInstructions && (
            <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
              📝 {order.specialInstructions}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex gap-2">
            {order.status === "ORDER_PLACED" && (
              <>
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, "STORE_ASSIGNED")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Accept Order
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateOrderStatus(order.id, "CANCELLED")}
                >
                  Decline
                </Button>
              </>
            )}
            {order.status === "STORE_ASSIGNED" && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus(order.id, "BEING_PREPARED")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Preparing
              </Button>
            )}
            {order.status === "BEING_PREPARED" && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus(order.id, "READY_FOR_PICKUP")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Mark Ready
              </Button>
            )}
            {order.status === "READY_FOR_PICKUP" && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus(order.id, "RIDER_ASSIGNED")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Assign Rider
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Dashboard</h1>
          <p className="text-gray-600">Real-time order management</p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold">{activeOrders.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">New Orders</p>
                  <p className="text-2xl font-bold">{newOrders.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ready for Pickup</p>
                  <p className="text-2xl font-bold">
                    {
                      activeOrders.filter(
                        (o) => o.status === "READY_FOR_PICKUP",
                      ).length
                    }
                  </p>
                </div>
                <Truck className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold">
                    {historicalOrders.length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active Orders ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="new">
              New Orders ({newOrders.length})
            </TabsTrigger>
            <TabsTrigger value="historical">
              Historical ({historicalOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className="grid gap-4">
              {activeOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active orders</p>
                  </CardContent>
                </Card>
              ) : (
                activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} showActions={true} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="new" className="mt-6">
            <div className="grid gap-4">
              {newOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No new orders</p>
                  </CardContent>
                </Card>
              ) : (
                newOrders.map((order) => (
                  <OrderCard key={order.id} order={order} showActions={true} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="historical" className="mt-6">
            <div className="grid gap-4">
              {historicalOrders.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No historical orders</p>
                  </CardContent>
                </Card>
              ) : (
                historicalOrders.map((order) => (
                  <OrderCard key={order.id} order={order} showActions={false} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
