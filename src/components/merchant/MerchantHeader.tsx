"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  Store,
  User,
  Menu,
  X,
  BarChart3,
  DollarSign,
  Package,
  Bell,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MerchantHeaderProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

export function MerchantHeader({
  onMenuClick,
  isMenuOpen,
}: MerchantHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={`bg-white shadow-sm border-b z-50 md:ml-64 fixed top-0 left-0 right-0 `}
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

            <Link href="/merchant" className="flex items-center space-x-2">
              <div className="townkart-gradient p-2 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Merchant</span>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {/* Store Status */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">
                Store Open
              </span>
            </div>

            {/* Today's Sales */}
            <div className="flex items-center space-x-1 p-2">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700 hidden md:block">
                ₹12,450
              </span>
            </div>

            {/* Orders Today */}
            <div className="flex items-center space-x-1 p-2">
              <Package className="h-5 w-5 text-gray-600" />
              <Badge variant="secondary" className="hidden sm:inline-flex">
                28 orders
              </Badge>
            </div>

            {/* Analytics */}
            <Link
              href="/merchant/analytics"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
            >
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </Link>

            {/* Notifications */}
            <Link
              href="/notifications"
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
                      {user?.name?.charAt(0)?.toUpperCase() || "M"}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">
                      {user?.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/merchant/profile"
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/merchant/earnings"
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
              <span className="text-sm text-green-700 font-medium">
                Store Open
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>Sales: ₹12,450</span>
              <span>Orders: 28</span>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center space-x-8 mt-3">
          <Link
            href="/merchant/products"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Products
          </Link>
          <Link
            href="/merchant/orders"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Orders
          </Link>
          <Link
            href="/merchant/analytics"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Analytics
          </Link>
          <Link
            href="/merchant/earnings"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Earnings
          </Link>
        </nav>
      </div>
    </header>
  );
}
