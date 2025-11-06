import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import {
  ShoppingCart,
  User,
  Store,
  Bike,
  X,
  Home,
  Package,
  MapPin,
  Heart,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user, logout } = useAuth();
  const { getCartSummary } = useCart();
  const cartSummary = getCartSummary();

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
    { href: "/merchant/orders", icon: ShoppingCart, label: "Orders" },
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Menu Panel */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="townkart-gradient p-2 rounded">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">TownKart</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-townkart-primary rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.activeRole?.toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-500">{user.phoneNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <Link href="/cart" onClick={onClose}>
                <Button variant="outline" className="w-full relative">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                  {cartSummary.itemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {cartSummary.itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Link href="/shops" onClick={onClose}>
                <Button variant="outline" className="w-full">
                  <Store className="h-4 w-4 mr-2" />
                  Shops
                </Button>
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {getMenuItems().map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-3 text-gray-700 hover:bg-townkart-primary hover:text-white rounded-lg transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Additional Links */}
            <div className="mt-6 pt-4 border-t border-gray-200">
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
            {!user && (
              <Link href="/auth/login" onClick={onClose}>
                <Button className="w-full townkart-gradient hover:opacity-90">
                  Login / Sign Up
                </Button>
              </Link>
            )}
            <div className="text-xs text-gray-500 text-center mt-3">
              © 2024 TownKart
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
