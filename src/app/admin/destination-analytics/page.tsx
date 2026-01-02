"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  Briefcase,
  MapPin,
  TrendingUp,
  Users,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface DestinationAnalytics {
  userId: string;
  userName: string;
  totalAddresses: number;
  analytics: Array<{
    addressId: string;
    address: string;
    type: string;
    predictedType: string;
    confidence: number;
    orderCount: number;
    factors: string[];
  }>;
  summary: {
    home: number;
    work: number;
    other: number;
  };
}

export default function AdminDestinationAnalyticsPage() {
  const [analytics, setAnalytics] = useState<DestinationAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    home: 0,
    work: 0,
    other: 0,
  });

  // Fetch destination analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/destination-analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data.users);
        setSummary(data.data.summary);
        setSummary((prev) => ({ ...prev, totalUsers: data.data.totalUsers }));
      }
    } catch (error) {
      console.error("Failed to fetch destination analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "HOME":
        return <Home className="h-4 w-4" />;
      case "WORK":
        return <Briefcase className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "HOME":
        return "bg-blue-100 text-blue-800";
      case "WORK":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Destination Analytics
        </h1>
        <p className="text-gray-600">
          Predictive analytics for customer destination types
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Home Addresses
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.home}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Work Addresses
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.work}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Other Addresses
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.other}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">User Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Destination Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    <span>Home</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{summary.home}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${summary.totalUsers > 0 ? (summary.home / (summary.home + summary.work + summary.other)) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    <span>Work</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{summary.work}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${summary.totalUsers > 0 ? (summary.work / (summary.home + summary.work + summary.other)) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <span>Other</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{summary.other}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gray-600 h-2 rounded-full"
                        style={{
                          width: `${summary.totalUsers > 0 ? (summary.other / (summary.home + summary.work + summary.other)) * 100 : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6">
            {analytics.map((user) => (
              <Card key={user.userId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{user.userName}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {user.totalAddresses} addresses
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.analytics.map((addr) => (
                      <div
                        key={addr.addressId}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{addr.address}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(addr.predictedType)}>
                              {getTypeIcon(addr.predictedType)}
                              <span className="ml-1">{addr.predictedType}</span>
                            </Badge>
                            <Badge variant="secondary">
                              {addr.confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {addr.orderCount} orders • Current type: {addr.type}
                        </div>
                        {addr.factors.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <strong>Factors:</strong> {addr.factors.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
