"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Star,
  Package,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Mock chart components (in real app, use recharts or similar)
const MockBarChart = ({ data }: { data: any[] }) => (
  <div className="h-64 flex items-end justify-between space-x-2">
    {data.map((item, index) => (
      <div key={index} className="flex flex-col items-center flex-1">
        <div
          className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
          style={{
            height: `${(item.value / Math.max(...data.map((d) => d.value))) * 200}px`,
          }}
        ></div>
        <span className="text-xs text-gray-600 mt-2">{item.label}</span>
      </div>
    ))}
  </div>
);

const MockLineChart = ({ data }: { data: any[] }) => (
  <div className="h-64 relative">
    <svg className="w-full h-full" viewBox="0 0 400 200">
      <polyline
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        points={data
          .map(
            (point, index) =>
              `${(index / (data.length - 1)) * 380 + 10},${200 - (point.value / Math.max(...data.map((d) => d.value))) * 160}`,
          )
          .join(" ")}
      />
      {data.map((point, index) => (
        <circle
          key={index}
          cx={(index / (data.length - 1)) * 380 + 10}
          cy={200 - (point.value / Math.max(...data.map((d) => d.value))) * 160}
          r="4"
          fill="#10b981"
        />
      ))}
    </svg>
  </div>
);

const MockPieChart = ({ data }: { data: any[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <div className="h-64 flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {data.map((item, index) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;

          const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 100 + 80 * Math.cos((currentAngle * Math.PI) / 180);
          const y2 = 100 + 80 * Math.sin((currentAngle * Math.PI) / 180);

          const largeArcFlag = angle > 180 ? 1 : 0;

          return (
            <path
              key={index}
              d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
              fill={item.color}
            />
          );
        })}
      </svg>
      <div className="ml-6 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-sm text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function RiderAnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("week");
  const [activeTab, setActiveTab] = useState("overview");

  const [performanceData, setPerformanceData] = useState({
    overview: {
      totalDeliveries: 0,
      totalEarnings: 0,
      averageRating: 0,
      onTimeRate: 0,
      averageDeliveryTime: 0,
      customerSatisfaction: 0,
    },
    weeklyData: [] as any[],
    monthlyTrends: [] as any[],
    deliveryTimes: [] as any[],
    earningsBreakdown: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch earnings data
      const earningsResponse = await fetch(
        `/api/riders/earnings?period=${timeRange}`,
      );
      const earningsData = await earningsResponse.json();

      if (earningsData.success) {
        // Calculate weekly data from earnings
        const weeklyData = calculateWeeklyData(earningsData.data.earnings);
        const monthlyTrends = calculateMonthlyTrends(
          earningsData.data.earnings,
        );
        const earningsBreakdown = calculateEarningsBreakdown(
          earningsData.data.earnings,
        );

        setPerformanceData({
          overview: {
            totalDeliveries: earningsData.data.totalDeliveries,
            totalEarnings: earningsData.data.totalEarnings,
            averageRating: earningsData.data.averageRating || 0,
            onTimeRate: earningsData.data.onTimeRate || 0,
            averageDeliveryTime: 26, // This would need to be calculated from delivery logs
            customerSatisfaction: 96, // This would need to be calculated from reviews
          },
          weeklyData,
          monthlyTrends,
          deliveryTimes: [
            { range: "0-15min", count: 45, percentage: 29 },
            { range: "15-30min", count: 78, percentage: 50 },
            { range: "30-45min", count: 28, percentage: 18 },
            { range: "45min+", count: 5, percentage: 3 },
          ],
          earningsBreakdown,
        });
      }
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyData = (earnings: any[]) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyData = days.map((day) => ({
      day,
      deliveries: Math.floor(Math.random() * 20) + 5, // Mock data for now
      earnings: Math.floor(Math.random() * 2000) + 800,
    }));
    return weeklyData;
  };

  const calculateMonthlyTrends = (earnings: any[]) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const monthlyTrends = months.map((month) => ({
      month,
      deliveries: Math.floor(Math.random() * 50) + 100,
      earnings: Math.floor(Math.random() * 10000) + 10000,
      rating: (Math.random() * 0.5 + 4.5).toFixed(1),
    }));
    return monthlyTrends;
  };

  const calculateEarningsBreakdown = (earnings: any[]) => {
    const totalEarnings = earnings.reduce((sum, e) => sum + e.totalEarnings, 0);
    return [
      {
        category: "Base Fare",
        amount: totalEarnings * 0.75,
        percentage: 75,
        color: "#10b981",
      },
      {
        category: "Bonuses",
        amount: totalEarnings * 0.15,
        percentage: 15,
        color: "#3b82f6",
      },
      {
        category: "Tips",
        amount: totalEarnings * 0.1,
        percentage: 10,
        color: "#f59e0b",
      },
    ];
  };

  const getTrendIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change > 0,
      icon: change > 0 ? TrendingUp : TrendingDown,
      color: change > 0 ? "text-green-600" : "text-red-600",
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
              <p className="text-gray-600 mt-1">
                Track your performance and earnings insights
              </p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {performanceData.overview.totalDeliveries}
              </div>
              <div className="text-sm text-gray-600">Total Deliveries</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+12%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                ₹{performanceData.overview.totalEarnings.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Earnings</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+8%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {performanceData.overview.averageRating}
              </div>
              <div className="text-sm text-gray-600">Average Rating</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+0.2</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {performanceData.overview.onTimeRate}%
              </div>
              <div className="text-sm text-gray-600">On-Time Rate</div>
              <div className="flex items-center justify-center mt-2">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+3%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Deliveries Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Weekly Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MockBarChart
                    data={performanceData.weeklyData.map((item) => ({
                      label: item.day,
                      value: item.deliveries,
                    }))}
                  />
                </CardContent>
              </Card>

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Monthly Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MockLineChart
                    data={performanceData.monthlyTrends.map((item) => ({
                      label: item.month,
                      value: item.deliveries,
                    }))}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {performanceData.overview.customerSatisfaction}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Customer Satisfaction
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      Excellent
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {performanceData.overview.averageDeliveryTime}m
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg Delivery Time
                    </div>
                    <Badge variant="secondary" className="mt-2">
                      On Track
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      98%
                    </div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                    <Badge variant="secondary" className="mt-2">
                      Outstanding
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Earnings Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <MockPieChart data={performanceData.earningsBreakdown} />
                </CardContent>
              </Card>

              {/* Weekly Earnings */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Earnings Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <MockBarChart
                    data={performanceData.weeklyData.map((item) => ({
                      label: item.day,
                      value: item.earnings,
                    }))}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Earnings Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Earnings Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Daily Goal</span>
                      <span>₹800 / ₹1000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Weekly Goal</span>
                      <span>₹5600 / ₹7000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Monthly Goal</span>
                      <span>₹22400 / ₹28000</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Delivery Time Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.deliveryTimes.map((timeRange, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900 w-16">
                          {timeRange.range}
                        </span>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${timeRange.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 ml-4">
                        {timeRange.count} deliveries ({timeRange.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rating Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <MockLineChart
                  data={performanceData.monthlyTrends.map((item) => ({
                    label: item.month,
                    value: item.rating * 20, // Scale for chart
                  }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Performing Days */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Saturday</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          ₹2240
                        </div>
                        <div className="text-xs text-gray-500">
                          28 deliveries
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Friday</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          ₹1760
                        </div>
                        <div className="text-xs text-gray-500">
                          22 deliveries
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Wednesday</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600">
                          ₹1440
                        </div>
                        <div className="text-xs text-gray-500">
                          18 deliveries
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Areas for Improvement */}
              <Card>
                <CardHeader>
                  <CardTitle>Areas for Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Delivery Time
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700">
                        Consider optimizing routes during peak hours to reduce
                        delivery times.
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Customer Feedback
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Focus on maintaining high ratings by ensuring package
                        safety.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border-l-4 border-green-500 bg-green-50">
                    <h4 className="font-medium text-green-800 mb-2">
                      Peak Hours Strategy
                    </h4>
                    <p className="text-sm text-green-700">
                      Your performance is strongest on weekends. Consider
                      increasing availability during these high-demand periods
                      to maximize earnings.
                    </p>
                  </div>
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Route Optimization
                    </h4>
                    <p className="text-sm text-blue-700">
                      Using the app's route optimization feature could help
                      reduce delivery times by an estimated 15-20%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
