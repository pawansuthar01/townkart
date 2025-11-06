"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  MapPin,
  CreditCard,
  ShoppingBag,
  Heart,
  Bell,
  Settings,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
} from "lucide-react";

export default function CustomerDashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    favoriteShops: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      // Load user stats
      const statsResponse = await fetch("/api/users/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent orders
      const ordersResponse = await fetch("/api/orders?limit=5");
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.orders || []);
      }

      // Load addresses
      const addressesResponse = await fetch("/api/users/addresses");
      if (addressesResponse.ok) {
        const addressesData = await addressesResponse.json();
        setAddresses(addressesData.addresses || []);
      }

      // Load favorites (mock data for now)
      setFavorites([
        {
          id: 1,
          name: "Fresh Mart Grocery",
          rating: 4.5,
          image: "/api/placeholder/100/100",
        },
        {
          id: 2,
          name: "Healthy Bites Cafe",
          rating: 4.8,
          image: "/api/placeholder/100/100",
        },
      ]);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Please Login</h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to access your dashboard
          </p>
          <Link href="/auth/login">
            <Button className="w-full">Login</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="townkart-gradient p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">TownKart</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/cart">
                <Button variant="outline" size="sm">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Cart
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="townkart-gradient text-white text-xl">
                  {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.fullName?.split(" ")[0] || "User"}!
                </h1>
                <p className="text-gray-600">
                  Manage your orders, addresses, and preferences
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="townkart-gradient p-3 rounded-lg">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalOrders}
                      </p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-500 p-3 rounded-lg">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{stats.totalSpent}
                      </p>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-500 p-3 rounded-lg">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.favoriteShops}
                      </p>
                      <p className="text-sm text-gray-600">Favorite Shops</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="bg-orange-500 p-3 rounded-lg">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.pendingOrders}
                      </p>
                      <p className="text-sm text-gray-600">Pending Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Recent Orders</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentOrders.length > 0 ? (
                      <div className="space-y-4">
                        {recentOrders.slice(0, 3).map((order: any) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                Order #{order.orderNumber}
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.merchant?.businessName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                ₹{order.finalAmount}
                              </p>
                              <Badge
                                variant={
                                  order.orderStatus === "DELIVERED"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {order.orderStatus}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        <Link href="/customer/orders">
                          <Button variant="outline" className="w-full">
                            View All Orders
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <EmptyState
                        icon={Package}
                        title="No orders yet"
                        description="Your order history will appear here"
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/shops">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Browse Shops
                      </Button>
                    </Link>
                    <Link href="/cart">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        View Cart
                      </Button>
                    </Link>
                    <Link href="/customer/addresses">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        Manage Addresses
                      </Button>
                    </Link>
                    <Link href="/customer/profile">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Account Settings
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Your Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentOrders.length > 0 ? (
                    <div className="space-y-4">
                      {recentOrders.map((order: any) => (
                        <Card key={order.id}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="font-semibold">
                                  Order #{order.orderNumber}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {order.merchant?.businessName}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  order.orderStatus === "DELIVERED"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {order.orderStatus}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-600">
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="font-medium">
                                  ₹{order.finalAmount}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  View Details
                                </Button>
                                {order.orderStatus === "DELIVERED" && (
                                  <Button size="sm" variant="outline">
                                    <Star className="h-4 w-4 mr-1" />
                                    Rate Order
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Package}
                      title="No orders found"
                      description="You haven't placed any orders yet"
                      action={
                        <Link href="/shops">
                          <Button>Start Shopping</Button>
                        </Link>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Your Addresses</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address: any) => (
                        <Card key={address.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold">
                                    {address.name}
                                  </h3>
                                  {address.isDefault && (
                                    <Badge variant="secondary">Default</Badge>
                                  )}
                                </div>
                                <p className="text-gray-600">
                                  {address.line1}
                                  {address.line2 && `, ${address.line2}`}
                                </p>
                                <p className="text-gray-600">
                                  {address.city}, {address.state} -{" "}
                                  {address.pincode}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline">
                                  Edit
                                </Button>
                                {!address.isDefault && (
                                  <Button size="sm" variant="outline">
                                    Set Default
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Button className="w-full" variant="outline">
                        <MapPin className="h-4 w-4 mr-2" />
                        Add New Address
                      </Button>
                    </div>
                  ) : (
                    <EmptyState
                      icon={MapPin}
                      title="No addresses found"
                      description="Add your delivery addresses to place orders"
                      action={
                        <Button>
                          <MapPin className="h-4 w-4 mr-2" />
                          Add Address
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5" />
                    <span>Favorite Shops</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {favorites.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {favorites.map((shop: any) => (
                        <Card key={shop.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={shop.image} />
                                <AvatarFallback>
                                  {shop.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold">{shop.name}</h3>
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{shop.rating}</span>
                                </div>
                              </div>
                              <Button size="sm">Visit Shop</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Heart}
                      title="No favorites yet"
                      description="Your favorite shops will appear here"
                      action={
                        <Link href="/shops">
                          <Button>Browse Shops</Button>
                        </Link>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
