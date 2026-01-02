"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RiderLayout from "@/components/rider/RiderLayout";
import { Truck, DollarSign, Clock, Star, MapPin, Activity } from "lucide-react";

export default function RiderDashboard() {
  // Mock data - in real app this would come from API
  const stats = {
    todayDeliveries: 12,
    todayEarnings: 450,
    rating: 4.8,
    activeDeliveries: 2,
    onlineHours: 6.5,
  };

  return (
    <RiderLayout>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold">Rider Dashboard</h1>
          <p className="text-gray-600 text-sm">
            Welcome back! Here's your overview.
          </p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
                <p className="text-xs text-gray-600">Today's Deliveries</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">₹{stats.todayEarnings}</p>
                <p className="text-xs text-gray-600">Today's Earnings</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.rating}</p>
                <p className="text-xs text-gray-600">Rating</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeDeliveries}</p>
                <p className="text-xs text-gray-600">Active Orders</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Online Status</span>
              <Badge className="bg-green-100 text-green-800">Online</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">GPS Tracking</span>
              <Badge className="bg-blue-100 text-blue-800">Active</Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Today's Hours</span>
              <span className="text-sm font-medium">{stats.onlineHours}h</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-blue-500 text-white p-4 rounded-lg text-center font-medium hover:bg-blue-600 transition-colors">
            View Orders
          </button>
          <button className="bg-green-500 text-white p-4 rounded-lg text-center font-medium hover:bg-green-600 transition-colors">
            Go Online
          </button>
        </div>
      </div>
    </RiderLayout>
  );
}
