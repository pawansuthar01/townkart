"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ShoppingBag,
  Users,
  Truck,
  DollarSign,
  TrendingUp,
  Package,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  fetchAdminStats,
  fetchRecentOrders,
  fetchTopProducts,
} from "@/store/slices/adminSlice";
import { RootState, AppDispatch } from "@/store";

export default function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { stats, recentOrders, topProducts, loading, error } = useSelector(
    (state: RootState) => state.admin,
  );

  useEffect(() => {
    // Fetch stats first
    dispatch(fetchAdminStats());

    // Fetch recent orders and top products after a short delay to avoid connection issues
    const timer1 = setTimeout(() => dispatch(fetchRecentOrders()), 100);
    const timer2 = setTimeout(() => dispatch(fetchTopProducts()), 200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState
          title="Error Loading Dashboard"
          description={error}
          action={{
            label: "Try Again",
            onClick: () => {
              dispatch(fetchAdminStats());
              setTimeout(() => dispatch(fetchRecentOrders()), 100);
              setTimeout(() => dispatch(fetchTopProducts()), 200);
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Overview of your platform's performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
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
              ₹{stats?.totalRevenue || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Deliveries
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeDeliveries || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in transit
            </p>
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
              {stats?.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available in catalog
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Orders
              <Link href="/admin/orders">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders?.length ? (
              <div className="space-y-4">
                {recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.customer?.fullName || "Unknown"}
                      </p>
                      <Badge
                        variant={
                          order.status === "DELIVERED"
                            ? "default"
                            : order.status === "PENDING"
                              ? "secondary"
                              : "outline"
                        }
                        className="mt-1"
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{order.finalAmount}</p>
                      <div className="flex space-x-2 mt-2">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Recent Orders"
                description="Orders will appear here once customers start placing them."
              />
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top Products
              <Link href="/admin/products">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts?.length ? (
              <div className="space-y-4">
                {topProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={
                          product.images?.[0] || "/images/product-default.jpg"
                        }
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {product.shop?.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{product.price}</p>
                      <div className="flex space-x-2 mt-2">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Products"
                description="Products will appear here once added to the catalog."
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/products">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Package className="h-6 w-6" />
                <span>Manage Products</span>
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2"
              >
                <ShoppingBag className="h-6 w-6" />
                <span>View Orders</span>
              </Button>
            </Link>
            <Link href="/admin/delivery-monitoring">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Truck className="h-6 w-6" />
                <span>Track Deliveries</span>
              </Button>
            </Link>
            <Link href="/admin/delivery-charges">
              <Button
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center space-y-2"
              >
                <DollarSign className="h-6 w-6" />
                <span>Delivery Charges</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
