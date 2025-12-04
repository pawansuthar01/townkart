"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Settings,
  Trash2,
  MoreHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  Notification,
  NotificationType,
  notificationManager,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
} from "@/lib/notificationSystem";

interface NotificationCenterProps {
  userId: string;
  className?: string;
  maxHeight?: string;
  showSettings?: boolean;
}

export function NotificationCenter({
  userId,
  className = "",
  maxHeight = "400px",
  showSettings = true,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load notifications
  useEffect(() => {
    const loadNotifications = () => {
      const userNotifications = notificationManager.getUserNotifications(
        userId,
        {
          limit: 50,
        }
      );
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter((n) => !n.read).length);
    };

    loadNotifications();

    // Listen for real-time updates
    const handleNotificationEvent = (event: any) => {
      if (event.recipients.some((r: any) => r.userId === userId)) {
        loadNotifications();

        // Play sound for new notifications, especially orders
        if (soundEnabled && audioRef.current) {
          // Play different sounds for different notification types
          const isOrderNotification = [
            "order_status_update",
            "delivery_assigned",
            "delivery_started",
            "delivery_completed",
            "rider_delivery_offer",
          ].includes(event.type);

          if (isOrderNotification) {
            // Play order-specific sound (louder/more prominent)
            audioRef.current.volume = 0.8;
            audioRef.current.play().catch(() => {
              // Ignore audio play errors
            });
          } else {
            // Play regular notification sound
            audioRef.current.volume = 0.6;
            audioRef.current.play().catch(() => {
              // Ignore audio play errors
            });
          }
        }
      }
    };

    notificationManager.on("notification", handleNotificationEvent);

    return () => {
      notificationManager.off("notification", handleNotificationEvent);
    };
  }, [userId, soundEnabled]);

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    if (notificationManager.markAsRead(userId, notificationId)) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    const count = notificationManager.markAllAsRead(userId);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true, readAt: new Date() }))
    );
    setUnreadCount(0);
  };

  // Handle notification action
  const handleAction = (notification: Notification, action: any) => {
    switch (action.action) {
      case "navigate":
        // Navigate to the specified route
        window.location.href = action.params.route;
        break;
      case "call":
        window.open(`tel:${action.params.phone}`);
        break;
      default:
        console.log("Unknown action:", action);
    }

    // Mark as read when action is taken
    markAsRead(notification.id);
  };

  // Format notification for display
  const formatNotification = (notification: Notification) => {
    return {
      ...notification,
      timeAgo: formatNotificationTime(notification.createdAt),
      icon: getNotificationIcon(notification.type),
      color: getNotificationColor(notification.priority),
    };
  };

  return (
    <>
      {/* Hidden audio element for notification sounds */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmQdBzeN1fLOfCsFJHfH8N2QQAoUXrTp66hVFApGn
        "
      />
    </>
  );
}
