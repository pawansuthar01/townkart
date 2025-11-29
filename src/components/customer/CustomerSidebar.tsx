"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  ShoppingBag,
  Package,
  MapPin,
  Heart,
  CreditCard,
  Settings,
  Bell,
  LogOut,
  User,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const customerNavItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "My Orders",
    href: "/orders",
    icon: Package,
  },
  {
    title: "Track Order",
    href: "/orders/tracking",
    icon: Truck,
  },
  {
    title: "Addresses",
    href: "/customer/addresses",
    icon: MapPin,
  },
  {
    title: "Wishlist",
    href: "/wishlist",
    icon: Heart,
  },
  {
    title: "Payments",
    href: "/customer/payments",
    icon: CreditCard,
  },
];

export function CustomerSidebar({ isOpen, onClose }: CustomerSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 max-w-[280px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 md:relative md:translate-x-0 md:shadow-none md:w-64",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="townkart-gradient p-2 rounded">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                  Customer
                </span>
              </div>
              <button
                onClick={onClose}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-townkart-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">Customer</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {customerNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-townkart-primary text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Additional Links */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/customer/profile"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/notifications"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </li>
              </ul>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              © 2024 TownKart
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
