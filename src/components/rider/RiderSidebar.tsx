"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import {
  Home,
  Bike,
  DollarSign,
  Package,
  MapPin,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  User,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RiderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const riderNavItems = [
  {
    title: "Dashboard",
    href: "/rider",
    icon: Home,
  },
  {
    title: "Deliveries",
    href: "/rider/deliveries",
    icon: Bike,
  },
  {
    title: "Active Delivery",
    href: "/rider/active-delivery",
    icon: Package,
  },
  {
    title: "Earnings",
    href: "/rider/earnings",
    icon: DollarSign,
  },
  {
    title: "Delivery History",
    href: "/rider/history",
    icon: Clock,
  },
  {
    title: "Location",
    href: "/rider/location",
    icon: MapPin,
  },
  {
    title: "Analytics",
    href: "/rider/analytics",
    icon: BarChart3,
  },
];

export function RiderSidebar({ isOpen, onClose }: RiderSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [showDevices, setShowDevices] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserDevices();
    }
  }, [isOpen, user?.id]);

  const loadUserDevices = async () => {
    if (!user?.id) return;

    setLoadingDevices(true);
    try {
      const response = await fetch("/api/users/devices");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDevices(data.devices);
        }
      } else {
        console.error("Failed to load devices:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to load devices:", error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
      case "smartphone":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      case "desktop":
      case "computer":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-72 max-w-[320px] bg-white shadow-2xl transform transition-all duration-300 ease-in-out z-50 border-r border-gray-100",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50/30">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-townkart-primary/5 to-townkart-secondary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-townkart-primary to-townkart-secondary p-3 rounded-xl shadow-lg">
                  <Bike className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900 block">
                    Rider Panel
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    TownKart Delivery
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className=" p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="mt-4 p-4 bg-gradient-to-r from-townkart-primary/5 to-townkart-secondary/5 rounded-xl border border-townkart-primary/10">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-townkart-primary to-townkart-secondary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user.name?.charAt(0)?.toUpperCase() ||
                      user.phoneNumber?.slice(-2) ||
                      "R"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.name || "Rider"}
                    </p>
                    <p className="text-xs text-townkart-primary font-medium">
                      {user.phoneNumber}
                    </p>
                    <p className="text-xs text-gray-500">Rider Account</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 font-medium">
                      Online
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Shield className="h-3 w-3" />
                    <span>Verified</span>
                  </div>
                </div>

                {/* Device List Toggle */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => setShowDevices(!showDevices)}
                    className="flex items-center justify-between w-full text-left text-xs text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <span className="flex items-center space-x-1">
                      <Monitor className="h-3 w-3" />
                      <span>Active Devices ({devices.length})</span>
                    </span>
                    {showDevices ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </button>

                  {/* Device List */}
                  {showDevices && (
                    <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                      {loadingDevices ? (
                        <div className="text-xs text-gray-500 text-center py-2">
                          Loading devices...
                        </div>
                      ) : devices.length > 0 ? (
                        devices.slice(0, 3).map((device, index) => (
                          <div
                            key={device.id}
                            className="flex items-center space-x-2 text-xs bg-white/50 rounded px-2 py-1"
                          >
                            {getDeviceIcon(device.deviceType)}
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-gray-700">
                                {device.deviceName ||
                                  `${device.deviceType} ${device.os || ""}`}
                              </p>
                              <p className="text-gray-500">
                                {device.lastLoginAt
                                  ? formatLastLogin(device.lastLoginAt)
                                  : "Never"}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 text-center py-2">
                          No active devices
                        </div>
                      )}
                      {devices.length > 3 && (
                        <div className="text-xs text-townkart-primary text-center">
                          +{devices.length - 3} more devices
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {riderNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                        isActive
                          ? "bg-gradient-to-r from-townkart-primary to-townkart-secondary text-white shadow-lg"
                          : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-townkart-primary"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-5 w-5 transition-colors",
                          isActive
                            ? "text-white"
                            : "text-gray-500 group-hover:text-townkart-primary"
                        )}
                      />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Additional Links */}
            <div className="mt-6 pt-4 border-t border-gray-200/50">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                Account
              </div>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/rider/profile"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 rounded-xl transition-all duration-200 group"
                  >
                    <User className="h-5 w-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium">Profile</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rider/settings"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 rounded-xl transition-all duration-200 group"
                  >
                    <Settings className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/rider/notifications"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 rounded-xl transition-all duration-200 group"
                  >
                    <Bell className="h-5 w-5 text-gray-500 group-hover:text-purple-600 transition-colors" />
                    <span className="font-medium">Notifications</span>
                  </Link>
                </li>
                <li className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-700 rounded-xl transition-all duration-200 w-full text-left group"
                  >
                    <LogOut className="h-5 w-5 text-gray-500 group-hover:text-red-600 transition-colors" />
                    <span className="font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-townkart-primary to-townkart-secondary rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">T</span>
              </div>
              <div className="text-xs text-gray-600 font-medium">
                © 2025 TownKart Delivery
              </div>
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              Secure & Reliable
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
