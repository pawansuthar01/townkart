"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Package,
  ShoppingCart,
  Store,
  Bike,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DashboardData {
  stats: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalStores: number;
    totalRiders: number;
    totalRevenue: number;
    activeOrders: number;
    pendingDeliveries: number;
  };
  recentOrders: Array<{
    id: string;
    customer: string;
    store: string;
    total: number;
    status: string;
    date: string;
  }>;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  charts: {
    revenue: Array<{
      month: string;
      revenue: number;
    }>;
    orders: Array<{
      month: string;
      orders: number;
    }>;
    users: Array<{
      month: string;
      users: number;
    }>;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardData["stats"] | null>(null);
  const [recentOrders, setRecentOrders] = useState<
    DashboardData["recentOrders"] | null
  >(null);
  const [topProducts, setTopProducts] = useState<
    DashboardData["topProducts"] | null
  >(null);
  const [charts, setCharts] = useState<DashboardData["charts"] | null>(null);
  const [systemStatus, setSystemStatus] = useState<{
    serverStatus: string;
    databaseStatus: string;
    paymentGatewayStatus: string;
    smsServiceStatus: string;
    lastBackup: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard/stats");
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    const fetchCharts = async () => {
      try {
        const response = await fetch("/api/admin/dashboard/charts");
        const result = await response.json();
        if (result.success) {
          setCharts(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch charts:", err);
      }
    };

    const fetchRecentOrders = async () => {
      try {
        const response = await fetch("/api/admin/dashboard/recent-orders");
        const result = await response.json();
        if (result.success) {
          setRecentOrders(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch recent orders:", err);
      }
    };

    const fetchTopProducts = async () => {
      try {
        const response = await fetch("/api/admin/dashboard/top-products");
        const result = await response.json();
        if (result.success) {
          setTopProducts(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch top products:", err);
      }
    };

    const fetchSystemStatus = async () => {
      try {
        const response = await fetch("/api/admin/dashboard/system-status");
        const result = await response.json();
        if (result.success) {
          setSystemStatus(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch system status:", err);
      }
    };

    // Fetch all data independently
    fetchStats();
    fetchCharts();
    fetchRecentOrders();
    fetchTopProducts();
    fetchSystemStatus();

    setLoading(false);
  }, []);

  const StatsCardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );

  const ChartCardSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || "Failed to load dashboard"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the admin panel. Here's an overview of your platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats ? (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalUsers.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Products
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalProducts.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalOrders.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{stats.totalRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Stores
                </CardTitle>
                <Store className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStores}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Riders
                </CardTitle>
                <Bike className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRiders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Orders
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeOrders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Deliveries
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pendingDeliveries}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          Array.from({ length: 8 }).map((_, i) => <StatsCardSkeleton key={i} />)
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {charts ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={charts.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Orders Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={charts.orders}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={charts.users}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#ffc658"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => <ChartCardSkeleton key={i} />)
        )}
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recentOrders ? (
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-sm text-gray-500">{order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{order.total}</p>
                      <Badge
                        variant={
                          order.status === "DELIVERED"
                            ? "default"
                            : order.status === "IN_TRANSIT"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-12 mb-1" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {topProducts ? (
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.sales} sales
                        </p>
                      </div>
                    </div>
                    <p className="font-medium">
                      ₹{product.revenue.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Manage Users</p>
                    <p className="text-sm text-blue-600">
                      View and edit user accounts
                    </p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
                <div className="flex items-center gap-3">
                  <Store className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Manage Stores</p>
                    <p className="text-sm text-green-600">
                      Approve and monitor stores
                    </p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="font-medium text-purple-900">
                      Manage Products
                    </p>
                    <p className="text-sm text-purple-600">
                      Review and moderate products
                    </p>
                  </div>
                </div>
              </button>
              <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors">
                <div className="flex items-center gap-3">
                  <Bike className="h-6 w-6 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-900">Manage Riders</p>
                    <p className="text-sm text-orange-600">
                      Assign and track deliveries
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {systemStatus ? (
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Server Status</span>
                  <Badge
                    variant="default"
                    className={`${
                      systemStatus.serverStatus === "Online"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {systemStatus.serverStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge
                    variant="default"
                    className={`${
                      systemStatus.databaseStatus === "Connected"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {systemStatus.databaseStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Payment Gateway</span>
                  <Badge
                    variant="default"
                    className={`${
                      systemStatus.paymentGatewayStatus === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {systemStatus.paymentGatewayStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SMS Service</span>
                  <Badge
                    variant="default"
                    className={`${
                      systemStatus.smsServiceStatus === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {systemStatus.smsServiceStatus}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Backup</span>
                  <span className="text-sm text-gray-600">
                    {systemStatus.lastBackup}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
