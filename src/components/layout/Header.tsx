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
  Heart,
  Store,
  Tag,
  Gift,
  Phone,
  HelpCircle,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { CartSidebar } from "@/components/shared/CartSidebar";
import { HomeSidebar } from "@/components/layout/HomeSidebar";
import { useWishlist } from "@/hooks/useWishlist";

export function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { getCartSummary } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const cartSummary = getCartSummary();

  return (
    <header
      className={`bg-white shadow-sm border-b z-50 fixed top-0 left-0 right-0`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Menu button and Logo */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>

            <Link href="/" className="flex items-center space-x-2">
              <div className="townkart-gradient p-2 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                TownKart
              </span>
              <span className="text-lg font-bold text-gray-900 sm:hidden">
                TK
              </span>
            </Link>
          </div>

          {/* Center: Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search products, shops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {/* Become a Partner - Desktop */}
            <Link
              href="/merchant/join"
              className="hidden lg:flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-townkart-primary hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Store className="h-4 w-4" />
              <span>Partner</span>
            </Link>

            {/* Become a Rider - Desktop */}
            <Link
              href="/rider/join"
              className="hidden lg:flex items-center space-x-1 px-3 py-2 text-sm text-gray-700 hover:text-townkart-primary hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Truck className="h-4 w-4" />
              <span>Rider</span>
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Wishlist"
            >
              <Heart className="h-5 w-5 text-gray-600" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
                  {wishlistCount}
                </Badge>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cart"
            >
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              {cartSummary.itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-townkart-primary">
                  {cartSummary.itemCount}
                </Badge>
              )}
            </button>

            {/* Login/Register */}
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="townkart" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search products, shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center space-x-8 mt-4">
          <Link
            href="/shops"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Browse Shops
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
            Deals & Offers
          </Link>
          <Link
            href="/special-offers"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Special Offers
          </Link>
          <Link
            href="/support"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Help & Support
          </Link>
        </nav>
      </div>

      {/* Home Sidebar */}
      <HomeSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
