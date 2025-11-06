"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

export default function MerchantDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  // Mock data for merchant dashboard
  const stats = {
    today: {
      orders: 24,
      revenue: 15420,
      customers: 18,
      rating: 4.6,
    },
    week: {
      orders: 156,
      revenue: 89450,
      customers: 89,
      rating: 4.5,
    },
    month: {
      orders: 624,
      revenue: 345890,
      customers: 345,
      rating: 4.7,
    },
  };

  const currentStats = stats[selectedPeriod as keyof typeof stats];

  const recentOrders = [
    {
      id: "ORD001",
      customer: "Rahul Sharma",
      items: 3,
      total: 450,
      status: "preparing",
      time: "10 mins ago",
    },
    {
      id: "ORD002",
      customer: "Priya Patel",
      items: 2,
      total: 280,
      status: "ready",
      time: "25 mins ago",
    },
    {
      id: "ORD003",
      customer: "Amit Kumar",
      items: 5,
      total: 890,
      status: "delivered",
      time: "1 hour ago",
    },
    {
      id: "ORD004",
      customer: "Sneha Reddy",
      items: 1,
      total: 150,
      status: "cancelled",
      time: "2 hours ago",
    },
  ];

  const topProducts = [
    {
      id: 1,
      name: "Fresh Organic Tomatoes",
      sold: 45,
      revenue: 1800,
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1546470427-e9e826abd807?w=100&h=100&fit=crop",
    },
    {
      id: 2,
      name: "Farm Fresh Milk",
      sold: 32,
      revenue: 2080,
      rating: 4.6,
      image:
        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop",
    },
    {
      id: 3,
      name: "Whole Wheat Bread",
      sold: 28,
      revenue: 980,
      rating: 4.4,
      image:
        "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "bg-yellow-500";
      case "ready":
        return "bg-blue-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "preparing":
        return <Clock className="h-3 w-3" />;
      case "ready":
        return <CheckCircle className="h-3 w-3" />;
      case "delivered":
        return <CheckCircle className="h-3 w-3" />;
      case "cancelled":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Merchant Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back! Here's your business overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/merchant/products/add">
                <Button className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="bg-white border-b">
        <div className="w-full px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            {["today", "week", "month"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Orders
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {currentStats.orders}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% from last period
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ₹{currentStats.revenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8% from last period
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Customers
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {currentStats.customers}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15% from last period
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {currentStats.rating}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Excellent
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <Star className="h-6 w-6 text-yellow-600 fill-current" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                    <Link href="/merchant/orders">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.customer}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.items} items • ₹{order.total} •{" "}
                              {order.time}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge
                            className={`${getStatusColor(order.status)} text-white flex items-center gap-1`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Products */}
            <div>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Top Products</CardTitle>
                    <Link href="/merchant/products">
                      <Button variant="outline" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center space-x-3"
                      >
                        <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div
                          className="w-10 h-10 bg-cover bg-center rounded-lg"
                          style={{ backgroundImage: `url(${product.image})` }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {product.sold} sold • ₹{product.revenue}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-xs">{product.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/merchant/products/add">
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col items-center justify-center"
                    >
                      <Plus className="h-6 w-6 mb-2" />
                      <span className="text-sm">Add Product</span>
                    </Button>
                  </Link>
                  <Link href="/merchant/orders">
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col items-center justify-center"
                    >
                      <Package className="h-6 w-6 mb-2" />
                      <span className="text-sm">Manage Orders</span>
                    </Button>
                  </Link>
                  <Link href="/merchant/analytics">
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col items-center justify-center"
                    >
                      <BarChart3 className="h-6 w-6 mb-2" />
                      <span className="text-sm">View Analytics</span>
                    </Button>
                  </Link>
                  <Link href="/merchant/earnings">
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col items-center justify-center"
                    >
                      <DollarSign className="h-6 w-6 mb-2" />
                      <span className="text-sm">Earnings</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Today's Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Order Completion</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Customer Satisfaction</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>On-time Delivery</span>
                      <span>96%</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Low Stock Alert
                      </p>
                      <p className="text-xs text-yellow-700">
                        5 products are running low on stock
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        New Review
                      </p>
                      <p className="text-xs text-blue-700">
                        You received a 5-star review
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Sales Milestone
                      </p>
                      <p className="text-xs text-green-700">
                        Reached 100 orders this week!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
