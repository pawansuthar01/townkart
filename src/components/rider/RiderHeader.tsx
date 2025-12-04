"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Bike,
  User,
  Menu,
  X,
  MapPin,
  DollarSign,
  Bell,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

interface RiderHeaderProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

export function RiderHeader({ onMenuClick, isMenuOpen }: RiderHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodayStats();
    }
  }, [isAuthenticated]);

  const fetchTodayStats = async () => {
    try {
      const response = await fetch("/api/riders/earnings?period=day");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.earnings.length > 0) {
          const today = data.data.earnings[0];
          setTodayEarnings(today.totalEarnings);
          setTodayDeliveries(1); // This would need to be calculated from delivery count
        }
      }
    } catch (error) {
      console.error("Failed to fetch today stats:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={`bg-white shadow-sm border-b sticky top-0 z-50 ${isMenuOpen ? "md:ml-64" : ""}`}
    >
      <div className="px-4 py-3">
        {/* Mobile-first layout */}
        <div className="flex items-center justify-between">
          {/* Left: Menu button and Logo */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>

            <Link href="/rider" className="flex items-center space-x-2">
              <div className="townkart-gradient p-2 rounded-lg">
                <Bike className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Rider</span>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {/* Current Status - Mobile */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">Online</span>
            </div>

            {/* Earnings */}
            <Link
              href="/rider/earnings"
              className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <DollarSign className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                ₹{todayEarnings.toLocaleString()}
              </span>
            </Link>

            {/* Today's Deliveries */}
            <div className="flex items-center space-x-1 p-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {todayDeliveries} today
              </Badge>
            </div>

            {/* Location */}
            <Link
              href="/rider/location"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
            >
              <MapPin className="h-5 w-5 text-gray-600" />
            </Link>

            {/* Notifications */}
            <Link
              href="/rider/notifications"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                    <div className="w-8 h-8 bg-townkart-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "R"}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">
                      {user?.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/rider/profile"
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/rider/earnings"
                      className="flex items-center space-x-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Earnings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button variant="townkart" size="sm">
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Status Bar - Mobile */}
        <div className="mt-3 sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">Online</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Today's: {todayDeliveries}</span>
              <span>Earnings: ₹{todayEarnings.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center space-x-8 mt-3">
          <Link
            href="/rider/deliveries"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Deliveries
          </Link>
          <Link
            href="/rider/earnings"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Earnings
          </Link>
          <Link
            href="/rider/history"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            History
          </Link>
          <Link
            href="/rider/analytics"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Analytics
          </Link>
        </nav>
      </div>
    </header>
  );
}
