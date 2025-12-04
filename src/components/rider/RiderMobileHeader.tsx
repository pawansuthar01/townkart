"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Bell,
  Settings,
  MapPin,
  Battery,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState, useEffect } from "react";

interface RiderMobileHeaderProps {
  showBackButton?: boolean;
  title?: string;
  showStatus?: boolean;
}

export function RiderMobileHeader({
  showBackButton = false,
  title,
  showStatus = true,
}: RiderMobileHeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryLevel, setBatteryLevel] = useState(100);

  useEffect(() => {
    // Network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Battery status
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener("levelchange", () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Get page title from pathname
  const getPageTitle = () => {
    if (title) return title;

    const pathMap: { [key: string]: string } = {
      "/rider": "Dashboard",
      "/rider/deliveries": "Deliveries",
      "/rider/active-delivery": "Active Delivery",
      "/rider/earnings": "Earnings",
      "/rider/history": "History",
      "/rider/location": "Location",
      "/rider/analytics": "Analytics",
      "/rider/profile": "Profile",
      "/rider/settings": "Settings",
      "/rider/notifications": "Notifications",
    };

    return pathMap[pathname] || "Rider App";
  };

  const canGoBack = () => {
    return showBackButton || pathname !== "/rider";
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-40">
      {/* Status Bar Simulation */}
      <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
        <span>9:41</span>
        <div className="flex items-center space-x-1">
          <Wifi
            className={isOnline ? "text-white" : "text-gray-500"}
            size={12}
          />
          <Battery className="text-white" size={12} />
          <span className="text-white">{batteryLevel}%</span>
        </div>
      </div>

      {/* App Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white">
        {/* Left: Back button or Menu */}
        <div className="flex items-center">
          {canGoBack() ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="p-2 mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10 h-10 bg-townkart-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-bold text-lg">R</span>
            </div>
          )}

          {/* Page Title */}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
            {showStatus && (
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">
                  Online
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Location Quick Access */}
          <Link
            href="/rider/location"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MapPin className="h-5 w-5 text-gray-600" />
          </Link>

          {/* Notifications */}
          <Link
            href="/rider/notifications"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {/* Notification badge - would be dynamic */}
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              3
            </Badge>
          </Link>

          {/* Settings */}
          <Link
            href="/rider/settings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-600" />
          </Link>
        </div>
      </div>
    </header>
  );
}
