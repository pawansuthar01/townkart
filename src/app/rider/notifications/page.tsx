"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Star,
  Trash2,
  Settings,
  Filter,
} from "lucide-react";

interface Notification {
  id: string;
  type: "delivery" | "payment" | "system" | "alert";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
  metadata?: any;
}

export default function RiderNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/riders/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        // Mock data for development
        setNotifications([
          {
            id: "1",
            type: "delivery",
            title: "New Delivery Available",
            message:
              "A new delivery order is available in your area. Distance: 2.5km",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            read: false,
            priority: "high",
            actionUrl: "/rider/deliveries/available",
          },
          {
            id: "2",
            type: "payment",
            title: "Payment Received",
            message:
              "₹250 has been credited to your account for delivery #12345",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            read: false,
            priority: "medium",
          },
          {
            id: "3",
            type: "system",
            title: "Profile Update Required",
            message:
              "Please update your vehicle information to continue receiving deliveries",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            read: true,
            priority: "medium",
            actionUrl: "/rider/profile",
          },
          {
            id: "4",
            type: "alert",
            title: "Location Tracking Issue",
            message:
              "Unable to track your location. Please check GPS permissions.",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            read: true,
            priority: "high",
            actionUrl: "/rider/location",
          },
          {
            id: "5",
            type: "delivery",
            title: "Delivery Completed",
            message:
              "Order #12346 has been successfully delivered. Rating: 5 stars",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            read: true,
            priority: "low",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/riders/notifications/${notificationId}/read`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/riders/notifications/mark-all-read", {
        method: "POST",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/riders/notifications/${notificationId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "delivery":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "payment":
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case "system":
        return <Settings className="h-5 w-5 text-purple-500" />;
      case "alert":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return time.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                Stay updated with your delivery activities and earnings
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  Mark All Read
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-5 w-5 p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="delivery">Deliveries</TabsTrigger>
            <TabsTrigger value="payment">Payments</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="alert">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === "unread"
                      ? "You have no unread notifications."
                      : `No ${activeTab} notifications found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.read ? "bg-blue-50" : ""
                    } hover:shadow-md transition-shadow`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {notification.title}
                              </h3>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                  {formatTimeAgo(notification.timestamp)}
                                </span>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-700 mb-4">
                              {notification.message}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant="outline"
                                  className="text-xs capitalize"
                                >
                                  {notification.type}
                                </Badge>
                                <Badge
                                  variant={
                                    notification.priority === "high"
                                      ? "destructive"
                                      : notification.priority === "medium"
                                        ? "default"
                                        : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {notification.priority}
                                </Badge>
                              </div>

                              <div className="flex items-center space-x-2">
                                {notification.actionUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      markAsRead(notification.id);
                                      window.location.href =
                                        notification.actionUrl!;
                                    }}
                                  >
                                    View Details
                                  </Button>
                                )}
                                {!notification.read && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    deleteNotification(notification.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Notification Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Delivery Notifications
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">New delivery assignments</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Delivery status updates</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Customer feedback</span>
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Payment Notifications
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Payment received</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Weekly payouts</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Bonus earnings</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button>Save Preferences</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
