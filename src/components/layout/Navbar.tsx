import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";
import {
  ShoppingCart,
  User,
  Store,
  Bike,
  Bell,
  Settings,
  LogOut,
  Shield,
  Monitor,
  Package,
  Heart,
} from "lucide-react";

export function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const { getCartSummary } = useCart();
  const cartSummary = getCartSummary();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="w-full px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="townkart-gradient p-2 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">TownKart</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/shops"
              className="text-gray-700 hover:text-townkart-primary transition-colors"
            >
              Shops
            </Link>
            <Link
              href="/categories"
              className="text-gray-700 hover:text-townkart-primary transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/offers"
              className="text-gray-700 hover:text-townkart-primary transition-colors"
            >
              Offers
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/cart" className="relative">
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cartSummary.itemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {cartSummary.itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {/* Role-based navigation */}
                {user?.activeRole === "MERCHANT" && (
                  <Link href="/merchant">
                    <Button variant="outline" size="sm">
                      <Store className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                {user?.activeRole === "RIDER" && (
                  <Link href="/rider">
                    <Button variant="outline" size="sm">
                      <Bike className="h-4 w-4 mr-2" />
                      Deliveries
                    </Button>
                  </Link>
                )}
                {user?.activeRole === "CUSTOMER" && (
                  <>
                    <Link href="/orders">
                      <Button variant="outline" size="sm">
                        <Package className="h-4 w-4 mr-2" />
                        Orders
                      </Button>
                    </Link>
                    <Link href="/wishlist">
                      <Button variant="outline" size="sm">
                        <Heart className="h-4 w-4 mr-2" />
                        Wishlist
                      </Button>
                    </Link>
                    <Link href="/customer">
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-2" />
                        Account
                      </Button>
                    </Link>
                  </>
                )}

                {/* Notifications */}
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>

                {/* User Profile */}
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.image || undefined}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback>
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-sm">
                    <p className="font-medium text-gray-900">{user?.name}</p>
                    <p className="text-gray-500 capitalize">
                      {user?.activeRole?.toLowerCase()}
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <Button variant="townkart">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
