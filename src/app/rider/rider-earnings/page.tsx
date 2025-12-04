"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  CreditCard,
  Clock,
  Package,
  Star,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface EarningsData {
  date: string;
  deliveries: number;
  earnings: number;
  bonuses: number;
  penalties: number;
  total: number;
  status: "paid" | "pending" | "processing";
}

interface PayoutData {
  id: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  status: "completed" | "failed" | "pending";
}

export default function RiderEarningsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [payoutData, setPayoutData] = useState<PayoutData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarningsData();
  }, [selectedPeriod]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/riders/earnings?period=${selectedPeriod}`
      );
      const data = await response.json();

      if (data.success) {
        setEarningsData(
          data.data.earnings.map((e: any) => ({
            date: e.date,
            deliveries: 1, // This would need to be calculated from delivery count
            earnings: e.baseEarnings,
            bonuses: e.bonusEarnings,
            penalties: e.penaltyAmount,
            total: e.totalEarnings,
            status: e.isPaid ? "paid" : "pending",
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch earnings data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mock payout data - TODO: connect to real API
  useEffect(() => {
    const mockPayouts: PayoutData[] = [
      {
        id: "1",
        amount: 2500,
        date: "2024-11-25",
        method: "Bank Transfer",
        reference: "TXN123456789",
        status: "completed",
      },
      {
        id: "2",
        amount: 1800,
        date: "2024-11-18",
        method: "UPI",
        reference: "UPI987654321",
        status: "completed",
      },
      {
        id: "3",
        amount: 3200,
        date: "2024-11-11",
        method: "Bank Transfer",
        reference: "TXN456789123",
        status: "pending",
      },
    ];
    setPayoutData(mockPayouts);
  }, []);

  const summaryStats = {
    today: { earnings: 85, deliveries: 3 },
    week: { earnings: 810, deliveries: 26 },
    month: { earnings: 3240, deliveries: 108 },
    total: { earnings: 45600, deliveries: 1520 },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "pending":
        return "Pending";
      case "processing":
        return "Processing";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile App Header Actions */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-green-800">
                ₹{summaryStats.today.earnings}
              </div>
              <div className="text-xs text-green-600">Today</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-blue-800">
                ₹{summaryStats.week.earnings}
              </div>
              <div className="text-xs text-blue-600">This Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly & Total Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-purple-800">
                ₹{summaryStats.month.earnings}
              </div>
              <div className="text-xs text-purple-600">This Month</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4 text-center">
              <CreditCard className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-indigo-800">
                ₹{summaryStats.total.earnings}
              </div>
              <div className="text-xs text-indigo-600">Total</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="history">Earnings History</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {summaryStats.total.deliveries}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Deliveries
                    </div>
                  </div>
                  <div className="text-center">
                    <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">4.8</div>
                    <div className="text-sm text-gray-600">Average Rating</div>
                  </div>
                  <div className="text-center">
                    <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">95%</div>
                    <div className="text-sm text-gray-600">On-Time Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Earnings Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earningsData.slice(0, 7).map((day, index) => (
                    <div
                      key={day.date}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString("en-IN", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {day.deliveries} deliveries
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{day.total}
                          </div>
                          <div className="text-xs text-gray-500">
                            Base: ₹{day.earnings}
                            {day.bonuses > 0 && ` + ₹${day.bonuses} bonus`}
                            {day.penalties > 0 &&
                              ` - ₹${day.penalties} penalty`}
                          </div>
                        </div>
                        <Badge className={getStatusColor(day.status)}>
                          {getStatusText(day.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings History Tab */}
          <TabsContent value="history" className="space-y-6">
            {/* Period Selector */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Earnings History</h2>
              <div className="flex space-x-2">
                {["week", "month", "year"].map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Earnings Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Deliveries
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Base Earnings
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bonuses
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Penalties
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {earningsData.map((earning, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(earning.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {earning.deliveries}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{earning.earnings}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                            +₹{earning.bonuses}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                            -₹{earning.penalties}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{earning.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(earning.status)}>
                              {getStatusText(earning.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutData.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payout.method}
                          </div>
                          <div className="text-sm text-gray-600">
                            {payout.reference}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ₹{payout.amount}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(payout.date).toLocaleDateString("en-IN")}
                          </div>
                        </div>
                        <Badge className={getStatusColor(payout.status)}>
                          {getStatusText(payout.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payout Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Payout Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Bank Account</h3>
                    <p className="text-sm text-gray-600">
                      Update your bank details for payouts
                    </p>
                  </div>
                  <Button variant="outline">Update Bank Details</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">UPI ID</h3>
                    <p className="text-sm text-gray-600">
                      Set up UPI for instant payouts
                    </p>
                  </div>
                  <Button variant="outline">Update UPI ID</Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Payout Schedule
                    </h3>
                    <p className="text-sm text-gray-600">
                      Weekly payouts every Monday
                    </p>
                  </div>
                  <Button variant="outline">Change Schedule</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
