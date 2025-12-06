"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  MessageSquare,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface OTPMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  averageRetries: number;
  channelStats: Record<
    string,
    { sent: number; delivered: number; failed: number }
  >;
}

export default function OTPMetricsPage() {
  const [metrics, setMetrics] = useState<OTPMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week">("day");

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/otp-metrics?timeRange=${timeRange}`
      );
      if (!response.ok) throw new Error("Failed to fetch OTP metrics");

      const data = await response.json();
      setMetrics(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "sms":
        return <Phone className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel.toLowerCase()) {
      case "sms":
        return "#3B82F6";
      case "email":
        return "#10B981";
      case "whatsapp":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const prepareChartData = () => {
    if (!metrics) return [];

    return Object.entries(metrics.channelStats).map(([channel, stats]) => ({
      channel: channel.charAt(0).toUpperCase() + channel.slice(1),
      sent: stats.sent,
      delivered: stats.delivered,
      failed: stats.failed,
      deliveryRate:
        stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : 0,
    }));
  };

  const preparePieData = () => {
    if (!metrics) return [];

    const data = [
      { name: "Delivered", value: metrics.totalDelivered, color: "#10B981" },
      { name: "Failed", value: metrics.totalFailed, color: "#EF4444" },
    ];

    return data.filter((item) => item.value > 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">OTP Metrics</h1>
          <p className="text-gray-600">Monitor OTP delivery performance</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchMetrics} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {metrics && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Sent
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalSent}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.totalDelivered}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.deliveryRate.toFixed(1)}% success rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.totalFailed}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Retries
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.averageRetries.toFixed(1)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="channel" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sent" fill="#3B82F6" name="Sent" />
                    <Bar dataKey="delivered" fill="#10B981" name="Delivered" />
                    <Bar dataKey="failed" fill="#EF4444" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Delivery Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={preparePieData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {preparePieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Channel Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Channel Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.channelStats).map(
                  ([channel, stats]) => (
                    <div
                      key={channel}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel)}
                        <div>
                          <p className="font-medium capitalize">{channel}</p>
                          <p className="text-sm text-gray-500">
                            {stats.sent} sent • {stats.delivered} delivered •{" "}
                            {stats.failed} failed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            stats.sent > 0 && stats.delivered / stats.sent > 0.8
                              ? "default"
                              : stats.sent > 0 &&
                                  stats.delivered / stats.sent > 0.5
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {stats.sent > 0
                            ? `${((stats.delivered / stats.sent) * 100).toFixed(1)}%`
                            : "0%"}{" "}
                          Success
                        </Badge>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent OTP Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent OTP Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>OTP logs will be displayed here</p>
                <p className="text-sm">
                  Check database for detailed OTP records
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
