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
  Heart,
} from "lucide-react";
import { useState } from "react";
import { CartSidebar } from "@/components/shared/CartSidebar";
import { HomeSidebar } from "@/components/layout/HomeSidebar";
import { useWishlist } from "@/hooks/useWishlist";
import { useScrollFixed } from "@/hooks/useScrollFixed";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { getCartSummary } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount: wishlistCount } = useWishlist();
  const cartSummary = getCartSummary();
  const isFixed = useScrollFixed(10);

  return (
    <header
      className={`bg-white shadow-sm border-b z-50 ${isFixed ? "sticky top-0" : ""}`}
    >
      <div className="w-full  pb-2 ">
        {/* Top Bar - Offers & Links */}
        <div className="flex items-center px-2 md:px-3 py-2 text-white bg-townkart-primary justify-between text-xs md:text-sm mb-3">
          <div className="flex items-center space-x-1 md:space-x-6 overflow-x-auto flex-1 min-w-0">
            <span className="flex items-center space-x-1 whitespace-nowrap flex-shrink-0">
              <span>🎉</span>
              <span className="hidden sm:inline">
                Free delivery on orders above ₹499
              </span>
              <span className="sm:hidden">Free delivery ₹499+</span>
            </span>
            <Link
              href="/offers"
              className="hover:text-townkart-primary transition-colors whitespace-nowrap hidden sm:inline"
            >
              Special Offers
            </Link>
            <Link
              href="/categories"
              className="hover:text-townkart-primary transition-colors whitespace-nowrap hidden sm:inline"
            >
              Categories
            </Link>
          </div>
          <div className="hidden lg:flex items-center space-x-4 flex-shrink-0">
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
            <Link
              href="/wishlist"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-townkart-primary">
                  {wishlistCount}
                </Badge>
              )}
            </Link>

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                    <div className="w-8 h-8 bg-townkart-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">
                      {user?.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link
                      href={
                        user?.activeRole === "ADMIN"
                          ? "/admin/profile"
                          : `/${user?.activeRole?.toLowerCase()}/profile`
                      }
                      className="flex items-center space-x-2"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button variant="townkart">Login</Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2"
            >
              {isSidebarOpen ? (
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

        {/* Home Sidebar */}
        <HomeSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
