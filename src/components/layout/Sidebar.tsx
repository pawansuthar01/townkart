import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  ShoppingBag,
  Store,
  Bike,
  User,
  Settings,
  LogOut,
  BarChart3,
  Package,
  CreditCard,
  Heart,
  MapPin,
  Bell,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const customerMenuItems = [
    { href: "/customer", icon: Home, label: "Dashboard" },
    { href: "/customer/orders", icon: Package, label: "My Orders" },
    { href: "/customer/addresses", icon: MapPin, label: "Addresses" },
    { href: "/customer/favorites", icon: Heart, label: "Favorites" },
    { href: "/customer/payments", icon: CreditCard, label: "Payments" },
  ];

  const merchantMenuItems = [
    { href: "/merchant", icon: Home, label: "Dashboard" },
    { href: "/merchant/products", icon: Package, label: "Products" },
    { href: "/merchant/orders", icon: ShoppingBag, label: "Orders" },
    { href: "/merchant/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/merchant/earnings", icon: CreditCard, label: "Earnings" },
  ];

  const riderMenuItems = [
    { href: "/rider", icon: Home, label: "Dashboard" },
    { href: "/rider/deliveries", icon: Bike, label: "Deliveries" },
    { href: "/rider/earnings", icon: CreditCard, label: "Earnings" },
    { href: "/rider/history", icon: Package, label: "History" },
  ];

  const getMenuItems = () => {
    switch (user?.activeRole) {
      case "MERCHANT":
        return merchantMenuItems;
      case "RIDER":
        return riderMenuItems;
      default:
        return customerMenuItems;
    }
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
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:z-auto`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="townkart-gradient p-2 rounded">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                  TownKart
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
                    {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.activeRole?.toLowerCase()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {getMenuItems().map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-townkart-primary hover:text-white rounded-lg transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Additional Links */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/settings"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/notifications"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    <span>Notifications</span>
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors w-full text-left"
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
