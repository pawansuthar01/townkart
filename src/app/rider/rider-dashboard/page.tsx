"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle,
  AlertCircle,
  Navigation,
  Phone,
  Star,
  Calendar,
  Bike,
  Activity,
  Target,
  Award,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch, useSelector } from "react-redux";
import { fetchDeliveries } from "@/store/slices/deliverySlice";
import { RootState, AppDispatch } from "@/store";

export default function RiderDashboard() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { deliveries, loading } = useSelector(
    (state: RootState) => state.delivery,
  );
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    rating: 0,
    onTimeRate: 0,
    averageDeliveryTime: 0,
    activeDeliveries: 0,
    weeklyGoal: 50,
    weeklyProgress: 0,
  });

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchDeliveries(user.id));
      fetchRiderStats();
    }
  }, [dispatch, user?.id]);

  const fetchRiderStats = async () => {
    try {
      // Fetch earnings data
      const earningsResponse = await fetch("/api/riders/earnings?period=month");
      const earningsData = await earningsResponse.json();

      if (earningsData.success) {
        const today = new Date().toDateString();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const todayEarnings = earningsData.data.earnings
          .filter((e: any) => new Date(e.date).toDateString() === today)
          .reduce((sum: number, e: any) => sum + e.totalEarnings, 0);

        const weekEarnings = earningsData.data.earnings
          .filter((e: any) => new Date(e.date) >= weekAgo)
          .reduce((sum: number, e: any) => sum + e.totalEarnings, 0);

        setEarnings({
          today: todayEarnings,
          week: weekEarnings,
          month: earningsData.data.totalEarnings,
          total: earningsData.data.totalEarnings, // This should be lifetime total from rider profile
        });

        setStats((prev) => ({
          ...prev,
          totalDeliveries: earningsData.data.totalDeliveries,
          rating: earningsData.data.averageRating || 0,
          onTimeRate: earningsData.data.onTimeRate || 0,
          averageDeliveryTime: 28, // This would need to be calculated from delivery logs
        }));
      }
    } catch (error) {
      console.error("Failed to fetch rider stats:", error);
    }
  };

  const activeDeliveries = deliveries.filter(
    (d) => d.deliveryStatus !== "DELIVERED",
  );
  const completedDeliveries = deliveries.filter(
    (d) => d.deliveryStatus === "DELIVERED",
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-500";
      case "PICKED_UP":
        return "bg-yellow-500";
      case "OUT_FOR_DELIVERY":
        return "bg-orange-500";
      case "DELIVERED":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "Assigned";
      case "PICKED_UP":
        return "Picked Up";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery";
      case "DELIVERED":
        return "Delivered";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-12">
        <div className="w-full px-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Bike className="h-12 w-12 mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold">
                Rider Dashboard
              </h1>
            </div>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Welcome back, {user?.name}! Ready to earn with TownKart
              deliveries.
            </p>
          </div>
        </div>
      </section>

      <div className="w-full px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                ₹{earnings.today}
              </div>
              <div className="text-sm text-gray-600">Today's Earnings</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalDeliveries}
              </div>
              <div className="text-sm text-gray-600">Total Deliveries</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.rating}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {stats.averageDeliveryTime}m
              </div>
              <div className="text-sm text-gray-600">Avg Delivery Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Goal Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Weekly Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                Deliveries this week: {stats.weeklyProgress} /{" "}
                {stats.weeklyGoal}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (stats.weeklyProgress / stats.weeklyGoal) * 100,
                    100,
                  )}%`,
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Earnings Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ₹{earnings.today}
                </div>
                <div className="text-sm text-gray-600">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₹{earnings.week}
                </div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ₹{earnings.month}
                </div>
                <div className="text-sm text-gray-600">This Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  ₹{earnings.total}
                </div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deliveries Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                My Deliveries
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant={activeTab === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("active")}
                >
                  Active ({activeDeliveries.length})
                </Button>
                <Button
                  variant={activeTab === "history" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("history")}
                >
                  History ({completedDeliveries.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading deliveries...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(activeTab === "active"
                  ? activeDeliveries
                  : completedDeliveries
                ).map((delivery) => (
                  <Card
                    key={delivery.id}
                    className="border-l-4 border-l-green-500"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="font-semibold text-gray-900">
                              Order #{delivery.order?.orderNumber}
                            </h3>
                            <Badge
                              className={`${getStatusColor(delivery.deliveryStatus)} text-white`}
                            >
                              {getStatusText(delivery.deliveryStatus)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>
                                  Pickup:{" "}
                                  {delivery.order?.merchant.businessName}
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <Navigation className="h-4 w-4 mr-1" />
                                <span>
                                  Delivery: {delivery.order?.customer.fullName}
                                </span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <Package className="h-4 w-4 mr-1" />
                                <span>
                                  {delivery.order?.orderItems.length} items
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span>Earn ₹{delivery.deliveryFee}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>{delivery.distanceKm} km away</span>
                            </div>
                            {delivery.order?.customer.phoneNumber && (
                              <Button variant="outline" size="sm">
                                <Phone className="h-4 w-4 mr-1" />
                                Call Customer
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-2 mt-4 md:mt-0">
                          {delivery.deliveryStatus === "ASSIGNED" && (
                            <Button className="bg-green-500 hover:bg-green-600">
                              Accept Delivery
                            </Button>
                          )}
                          {delivery.deliveryStatus === "PICKED_UP" && (
                            <Button className="bg-blue-500 hover:bg-blue-600">
                              Start Delivery
                            </Button>
                          )}
                          {delivery.deliveryStatus === "OUT_FOR_DELIVERY" && (
                            <Button className="bg-orange-500 hover:bg-orange-600">
                              Mark Delivered
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {(activeTab === "active"
                  ? activeDeliveries
                  : completedDeliveries
                ).length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No {activeTab} deliveries
                    </h3>
                    <p className="text-gray-600">
                      {activeTab === "active"
                        ? "You don't have any active deliveries at the moment."
                        : "You haven't completed any deliveries yet."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Navigation className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">
                Available Deliveries
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Browse and accept new delivery tasks
              </p>
              <Button className="w-full">View Available Orders</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Activity className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Go Online</h3>
              <p className="text-sm text-gray-600 mb-4">
                Set your availability and start earning
              </p>
              <Button className="w-full bg-green-500 hover:bg-green-600">
                Go Online
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
              <p className="text-sm text-gray-600 mb-4">
                View your delivery stats and ratings
              </p>
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
