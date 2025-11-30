"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import {
  Home,
  Search,
  ShoppingBag,
  User,
  Store,
  Heart,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Gift,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";

interface HomeSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HomeSidebar({ isOpen, onClose }: HomeSidebarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartSummary } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const cartSummary = getCartSummary();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const navigationItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/shops", icon: Store, label: "Browse Shops" },
    { href: "/categories", icon: Menu, label: "Categories" },
    { href: "/offers", icon: ShoppingBag, label: "Deals & Offers" },
    { href: "/special-offers", icon: Gift, label: "Special Offers" },
    { href: "/support", icon: HelpCircle, label: "Help & Support" },
  ];

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
        } md:hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="townkart-gradient p-2 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">
                  TownKart
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            {isAuthenticated && user && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-townkart-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
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
              {navigationItems.map((item) => (
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

            {/* Quick Actions */}
            <div className="mt-8 pt-4 border-t border-gray-200">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/wishlist"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="relative">
                      <Heart className="h-5 w-5" />
                      {wishlistCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs bg-townkart-primary">
                          {wishlistCount > 99 ? "99+" : wishlistCount}
                        </Badge>
                      )}
                    </div>
                    <span>Wishlist</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cart"
                    onClick={onClose}
                    className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="relative">
                      <ShoppingBag className="h-5 w-5" />
                      {cartSummary.itemCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs bg-townkart-primary">
                          {cartSummary.itemCount > 99
                            ? "99+"
                            : cartSummary.itemCount}
                        </Badge>
                      )}
                    </div>
                    <span>Cart</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Auth Section */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors w-full text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="block w-full"
                >
                  <Button className="w-full townkart-gradient hover:opacity-90">
                    Login / Sign Up
                  </Button>
                </Link>
              )}
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
