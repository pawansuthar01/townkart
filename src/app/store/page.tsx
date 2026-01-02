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
  Bike,
  Navigation,
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

interface RiderLocation {
  id: string;
  riderId: string;
  riderName: string;
  phone: string;
  latitude: number;
  longitude: number;
  status: string;
  lastUpdate: string;
  distance: number;
}

export default function StoreDashboard() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [historicalOrders, setHistoricalOrders] = useState<Order[]>([]);
  const [nearbyRiders, setNearbyRiders] = useState<RiderLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch orders and nearby riders from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch orders
        const ordersResponse = await fetch("/api/store/orders");
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();
          if (ordersData.success) {
            // Categorize orders
            const active: Order[] = [];
            const newOrders: Order[] = [];
            const historical: Order[] = [];

            ordersData.orders.forEach((order: Order) => {
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

        // Fetch nearby riders
        try {
          const ridersResponse = await fetch(
            "/api/admin/riders/locations?limit=20"
          );
          if (ridersResponse.ok) {
            const ridersData = await ridersResponse.json();
            if (ridersData.success && ridersData.data?.riders) {
              // Filter and format nearby riders (within 10km)
              const nearby = ridersData.data.riders
                .filter(
                  (rider: any) => rider.currentLocation && rider.isAvailable
                )
                .map((rider: any) => ({
                  id: rider.userId,
                  riderId: rider.userId,
                  riderName: rider.name,
                  phone: rider.phoneNumber,
                  latitude: rider.currentLocation.latitude,
                  longitude: rider.currentLocation.longitude,
                  status: rider.isAvailable ? "AVAILABLE" : "BUSY",
                  lastUpdate: rider.currentLocation.lastUpdate,
                  distance: 0, // Will be calculated if store location is available
                }))
                .slice(0, 5); // Show top 5 nearby riders

              setNearbyRiders(nearby);
            }
          }
        } catch (ridersError) {
          console.error("Error fetching nearby riders:", ridersError);
          // Continue without riders data
          setNearbyRiders([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Clear data on error
        setActiveOrders([]);
        setNewOrders([]);
        setHistoricalOrders([]);
        setNearbyRiders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up polling for real-time updates (can be replaced with WebSocket)
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

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
                        (o) => o.status === "READY_FOR_PICKUP"
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

        {/* Nearby Riders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5" />
              Nearby Riders ({nearbyRiders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nearbyRiders.length === 0 ? (
              <div className="text-center py-8">
                <Bike className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No riders available nearby</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyRiders.map((rider) => (
                  <div key={rider.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium text-sm">
                          {rider.riderName}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rider.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {rider.phone}
                      </div>
                      <div className="flex items-center">
                        <Navigation className="h-3 w-3 mr-1" />
                        {rider.latitude.toFixed(4)},{" "}
                        {rider.longitude.toFixed(4)}
                      </div>
                      <div className="text-gray-500">
                        Updated:{" "}
                        {new Date(rider.lastUpdate).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
