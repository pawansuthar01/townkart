"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Filter,
  Loader2,
  Package,
  Truck,
  CreditCard,
  Gift,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  referenceId?: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch notifications
  const fetchNotifications = async (tab = activeTab, page = 1) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        userId: user.id,
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (tab === "unread") {
        params.set("isRead", "false");
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user, activeTab]);

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      // In a real app, you'd have an API endpoint to mark individual notifications as read
      // For now, we'll just update the local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true })),
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      // In a real app, you'd have a DELETE endpoint
      // For now, we'll just remove from local state
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId),
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ORDER_UPDATE":
        return <Package className="h-5 w-5 text-blue-600" />;
      case "DELIVERY_UPDATE":
        return <Truck className="h-5 w-5 text-green-600" />;
      case "PAYMENT_SUCCESS":
        return <CreditCard className="h-5 w-5 text-purple-600" />;
      case "PROMOTION":
        return <Gift className="h-5 w-5 text-pink-600" />;
      case "SYSTEM_ALERT":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please login to view notifications</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                Stay updated with your orders and offers
              </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              All Notifications
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {notifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-1 bg-red-500">{unreadCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-townkart-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {activeTab === "unread"
                      ? "No unread notifications"
                      : "No notifications yet"}
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === "unread"
                      ? "You've read all your notifications!"
                      : "We'll notify you about orders, offers, and updates here."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`transition-all hover:shadow-md ${
                      !notification.isRead
                        ? "border-l-4 border-l-townkart-primary bg-blue-50/30"
                        : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.notificationType)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {notification.title}
                                </h3>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-townkart-primary rounded-full"></div>
                                )}
                              </div>
                              <p className="text-gray-600 mb-3">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>
                                  {formatDate(notification.createdAt)}
                                </span>
                                <Badge
                                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                                >
                                  {notification.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {notification.notificationType.replace(
                                    "_",
                                    " ",
                                  )}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              {!notification.isRead && (
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Load More */}
                {pagination.page < pagination.totalPages && (
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      onClick={() =>
                        fetchNotifications(activeTab, pagination.page + 1)
                      }
                    >
                      Load More Notifications
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
