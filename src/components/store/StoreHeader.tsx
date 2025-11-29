"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Store,
  User,
  Menu,
  X,
  Package,
  ShoppingCart,
  Bell,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StoreHeaderProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

interface StoreStats {
  todayOrders: number;
  todayRevenue: number;
}

export function StoreHeader({ onMenuClick, isMenuOpen }: StoreHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [stats, setStats] = useState<StoreStats>({
    todayOrders: 0,
    todayRevenue: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/store/analytics?period=7d");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Calculate today's stats from the last day in dailyRevenue
            const todayStats =
              data.analytics.dailyRevenue[
                data.analytics.dailyRevenue.length - 1
              ];
            setStats({
              todayOrders: todayStats?.orders || 0,
              todayRevenue: todayStats?.revenue || 0,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching store stats:", error);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
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

            <Link href="/store" className="flex items-center space-x-2">
              <div className="townkart-gradient p-2 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Store</span>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {/* Current Status - Mobile */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">Active</span>
            </div>

            {/* Today's Orders */}
            <div className="flex items-center space-x-1 p-2">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {stats.todayOrders} today
              </Badge>
            </div>

            {/* Revenue */}
            <div className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                ₹{stats.todayRevenue.toLocaleString()}
              </span>
            </div>

            {/* Products */}
            <Link
              href="/store/products"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
            >
              <Package className="h-5 w-5 text-gray-600" />
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-600" />
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                  <div className="w-8 h-8 bg-townkart-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "S"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">
                    {user?.name || "Demo Manager"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href="/store/profile"
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/store/analytics"
                    className="flex items-center space-x-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                </DropdownMenuItem>
                {isAuthenticated ? (
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/auth/login"
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Login</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Bar - Mobile */}
        <div className="mt-3 sm:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">Active</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Orders: {stats.todayOrders}</span>
              <span>Revenue: ₹{stats.todayRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center space-x-8 mt-3">
          <Link
            href="/store/products"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Products
          </Link>
          <Link
            href="/store/orders"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Orders
          </Link>
          <Link
            href="/store/analytics"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Analytics
          </Link>
          <Link
            href="/store/profile"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Profile
          </Link>
          <Link
            href="/store/wallet"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Wallet
          </Link>
        </nav>
      </div>
    </header>
  );
}
