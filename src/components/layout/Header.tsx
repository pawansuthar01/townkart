"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  X,
  LogOut,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { CartSidebar } from "@/components/shared/CartSidebar";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { getCartSummary } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const cartSummary = getCartSummary();

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="w-full  pb-2 ">
        {/* Top Bar - Offers & Links */}
        <div className="flex items-center px-3 py-2 text-white bg-townkart-primary justify-between text-sm mb-3">
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-1">
              <span>🎉</span>
              <span>Free delivery on orders above ₹499</span>
            </span>
            <Link
              href="/offers"
              className="hover:text-townkart-primary transition-colors"
            >
              Special Offers
            </Link>
            <Link
              href="/categories"
              className="hover:text-townkart-primary transition-colors"
            >
              Categories
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/merchant/join"
              className="hover:text-townkart-primary transition-colors"
            >
              Become a Merchant
            </Link>
            <Link
              href="/rider/join"
              className="hover:text-townkart-primary transition-colors"
            >
              Join as Rider
            </Link>
          </div>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between px-2">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="townkart-gradient p-2 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">TownKart</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/shops"
              className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
            >
              Shops
            </Link>
            <Link
              href="/categories"
              className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
            >
              Categories
            </Link>
            <Link
              href="/offers"
              className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
            >
              Offers
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 border-2 rounded-sm ">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products, shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 bg-white text-gray-900 border-0"
              />
            </div>
          </div>

          {/* Cart & Auth */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartSummary.itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-townkart-primary">
                  {cartSummary.itemCount}
                </Badge>
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* User Profile */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-townkart-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">
                    {user?.name}
                  </span>
                </div>

                {/* Settings */}
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>

                {/* Logout */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button variant="townkart">Login</Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products, shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 bg-white text-gray-900 border-0"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t bg-white">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/shops"
                className="text-gray-700 hover:text-townkart-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Shops
              </Link>
              <Link
                href="/categories"
                className="text-gray-700 hover:text-townkart-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                href="/offers"
                className="text-gray-700 hover:text-townkart-primary transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Offers
              </Link>

              {/* User Section in Mobile Menu */}
              {isAuthenticated ? (
                <div className="border-t pt-4 mt-4 space-y-4">
                  <div className="flex items-center space-x-3 pb-3">
                    <div className="w-10 h-10 bg-townkart-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {(user as any)?.activeRole?.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 text-gray-700 hover:text-townkart-primary transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 text-red-600 hover:text-red-700 transition-colors py-2 w-full text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="border-t pt-4 mt-4">
                  <Link
                    href="/auth/login"
                    className="block w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full townkart-gradient hover:opacity-90">
                      Login / Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
