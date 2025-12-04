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
    (state: RootState) => state.delivery
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
    (d) => d.deliveryStatus !== "DELIVERED"
  );
  const completedDeliveries = deliveries.filter(
    (d) => d.deliveryStatus === "DELIVERED"
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
      {/* Mobile App Style Dashboard */}
      <div className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white rounded-2xl p-6 mb-6 shadow-townkart">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">
                Welcome back, {user?.name}!
              </h2>
              <p className="text-white/80 text-sm">
                Ready to earn with TownKart deliveries
              </p>
            </div>
            <Bike className="h-12 w-12 opacity-80" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-townkart-primary/10 to-townkart-primary/20 border-townkart-primary/30">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 text-townkart-primary mx-auto mb-2" />
              <div className="text-xl font-bold text-townkart-primary">
                ₹{earnings.today}
              </div>
              <div className="text-xs text-townkart-primary/80">
                Today's Earnings
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-townkart-info/10 to-townkart-info/20 border-townkart-info/30">
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 text-townkart-info mx-auto mb-2" />
              <div className="text-xl font-bold text-townkart-info">
                {activeDeliveries.length}
              </div>
              <div className="text-xs text-townkart-info/80">
                Active Deliveries
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-townkart-warning" />
                <span className="text-sm text-gray-600">Rating</span>
              </div>
              <span className="font-semibold">{stats.rating}/5.0</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-townkart-secondary" />
                <span className="text-sm text-gray-600">Avg Delivery Time</span>
              </div>
              <span className="font-semibold">
                {stats.averageDeliveryTime}m
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-townkart-accent" />
                <span className="text-sm text-gray-600">Weekly Goal</span>
              </div>
              <span className="font-semibold">
                {stats.weeklyProgress}/{stats.weeklyGoal}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Goal Progress */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-townkart-accent" />
                <span className="font-medium text-gray-900">Weekly Goal</span>
              </div>
              <span className="text-sm text-gray-600">
                {stats.weeklyProgress}/{stats.weeklyGoal}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-townkart-accent h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (stats.weeklyProgress / stats.weeklyGoal) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              {Math.round((stats.weeklyProgress / stats.weeklyGoal) * 100)}%
              complete
            </p>
          </CardContent>
        </Card>

        {/* Active Deliveries */}
        {activeDeliveries.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2 text-townkart-info" />
                  <span>Active Deliveries</span>
                </div>
                <Badge variant="secondary">{activeDeliveries.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading deliveries...</p>
                </div>
              ) : activeDeliveries.length > 0 ? (
                activeDeliveries.slice(0, 2).map((delivery) => (
                  <div
                    key={delivery.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-townkart-info" />
                        <span className="font-medium text-gray-900">
                          Order #{delivery.order?.orderNumber}
                        </span>
                      </div>
                      <Badge
                        className={`${getStatusColor(delivery.deliveryStatus)} text-white text-xs`}
                      >
                        {getStatusText(delivery.deliveryStatus)}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-townkart-error" />
                        <span>{delivery.order?.customer.fullName}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Navigation className="h-4 w-4 mr-2 text-townkart-info" />
                        <span>{delivery.distanceKm} km away</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-townkart-accent">
                        Earn ₹{delivery.deliveryFee}
                      </div>
                      {delivery.deliveryStatus === "ASSIGNED" && (
                        <Button
                          size="sm"
                          className="bg-townkart-accent hover:bg-townkart-accent/90"
                        >
                          Accept
                        </Button>
                      )}
                      {delivery.deliveryStatus === "PICKED_UP" && (
                        <Button
                          size="sm"
                          className="bg-townkart-info hover:bg-townkart-info/90"
                        >
                          Start
                        </Button>
                      )}
                      {delivery.deliveryStatus === "OUT_FOR_DELIVERY" && (
                        <Button
                          size="sm"
                          className="bg-townkart-warning hover:bg-townkart-warning/90"
                        >
                          Deliver
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">No active deliveries</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/rider/deliveries">
            <Card className="hover:shadow-townkart transition-all duration-200 cursor-pointer border-2 hover:border-townkart-info/50">
              <CardContent className="p-4 text-center">
                <Navigation className="h-8 w-8 text-townkart-info mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  Available Orders
                </h3>
                <p className="text-xs text-gray-600">Browse new deliveries</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/rider/analytics">
            <Card className="hover:shadow-townkart transition-all duration-200 cursor-pointer border-2 hover:border-townkart-secondary/50">
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-townkart-secondary mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  Performance
                </h3>
                <p className="text-xs text-gray-600">View your stats</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
