"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useScrollFixed } from "@/hooks/useScrollFixed";
import {
  ShoppingCart,
  Search,
  User,
  Menu,
  X,
  Heart,
  MapPin,
  Bell,
} from "lucide-react";
import { useState } from "react";
import { CartSidebar } from "@/components/shared/CartSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CustomerHeaderProps {
  onMenuClick: () => void;
  isMenuOpen: boolean;
}

export function CustomerHeader({
  onMenuClick,
  isMenuOpen,
}: CustomerHeaderProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { getCartSummary } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount: wishlistCount } = useWishlist();
  const cartSummary = getCartSummary();
  const isFixed = useScrollFixed(10);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header
      className={`bg-white shadow-sm border-b z-50 ${isFixed ? "sticky top-0" : ""}`}
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

            <Link href="/" className="flex items-center space-x-2">
              <div className="townkart-gradient p-2 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">TownKart</span>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {/* Location */}
            <Link
              href="/customer/addresses"
              className="hidden sm:flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MapPin className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-700 hidden md:block">
                Location
              </span>
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
            >
              <ShoppingCart className="h-5 w-5 text-gray-600" />
              {cartSummary.itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-townkart-primary">
                  {cartSummary.itemCount}
                </Badge>
              )}
            </button>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
            >
              <Bell className="h-5 w-5 text-gray-600" />
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                    <div className="w-8 h-8 bg-townkart-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "C"}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">
                      {user?.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/customer/profile"
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/customer/orders"
                      className="flex items-center space-x-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      <span>My Orders</span>
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
            )}
          </div>
        </div>

        {/* Search Bar - Mobile first */}
        <div className="mt-3">
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
        <nav className="hidden md:flex items-center justify-center space-x-8 mt-3">
          <Link
            href="/"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Home
          </Link>
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
          <Link
            href="/customer/orders"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            My Orders
          </Link>
          <Link
            href="/support"
            className="text-gray-700 hover:text-townkart-primary transition-colors font-medium"
          >
            Support
          </Link>
        </nav>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
