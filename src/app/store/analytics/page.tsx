"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  RefreshCw,
} from "lucide-react";

interface AnalyticsData {
  period: string;
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalItems: number;
    averageOrderValue: number;
    commissionRate: number;
    totalCommission: number;
    netEarnings: number;
  };
  statusBreakdown: Record<string, number>;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    totalRevenue: number;
  }>;
}

export default function StoreAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/store/analytics?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load analytics data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Analytics</h1>
          <p className="text-gray-600">Track your store's performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.period} period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{analytics.summary.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: ₹{analytics.summary.averageOrderValue.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.summary.totalItems}
            </div>
            <p className="text-xs text-muted-foreground">Total items ordered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{analytics.summary.averageOrderValue.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{analytics.summary.netEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              After {(analytics.summary.commissionRate * 100).toFixed(0)}%
              commission
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Commission
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{analytics.summary.totalCommission.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {(analytics.summary.commissionRate * 100).toFixed(0)}% of revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Commission Rate
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.summary.commissionRate * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Platform fee</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"></div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.dailyRevenue.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {new Date(day.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ₹{day.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {day.orders} orders
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.statusBreakdown).map(
                ([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <Badge variant="outline" className="capitalize">
                      {status.replace("_", " ")}
                    </Badge>
                    <span className="font-semibold">{count}</span>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topProducts.map((product, index) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-townkart-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      {product.totalSold} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ₹{product.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
