"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
} from "lucide-react";

// Mock data - in real app, this would come from API
const analytics = {
  revenue: {
    total: 125000,
    growth: 15.2,
    monthly: [85000, 92000, 105000, 125000],
  },
  orders: {
    total: 890,
    growth: 12.5,
    monthly: [650, 720, 810, 890],
  },
  users: {
    total: 1250,
    growth: 8.3,
    monthly: [1100, 1150, 1200, 1250],
  },
  topCategories: [
    { name: "Electronics", revenue: 45000, orders: 180 },
    { name: "Clothing", revenue: 32000, orders: 145 },
    { name: "Home & Kitchen", revenue: 28000, orders: 120 },
    { name: "Books", revenue: 20000, orders: 95 },
  ],
  topStores: [
    { name: "TechHub Store", revenue: 35000, orders: 140 },
    { name: "Fashion Hub", revenue: 28000, orders: 110 },
    { name: "Mobile World", revenue: 25000, orders: 95 },
    { name: "Book Paradise", revenue: 22000, orders: 85 },
  ],
};

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Analytics & Reports
        </h1>
        <p className="text-gray-600">
          Platform performance insights and analytics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{analytics.revenue.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +{analytics.revenue.growth}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.orders.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                +{analytics.orders.growth}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.users.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{analytics.users.growth}%</span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  Revenue chart will be displayed here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  Order growth chart will be displayed here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories and Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCategories.map((category, index) => (
                <div
                  key={category.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-gray-500">
                        {category.orders} orders
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">
                    ₹{category.revenue.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topStores.map((store, index) => (
                <div
                  key={store.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-sm text-gray-500">
                        {store.orders} orders
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">
                    ₹{store.revenue.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
