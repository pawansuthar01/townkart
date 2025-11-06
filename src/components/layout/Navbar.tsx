import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingCart, User, Store, Bike, Bell, Settings } from "lucide-react";

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
              <div className="flex items-center space-x-2">
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
                  <Link href="/customer">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                  </Link>
                )}

                {/* Notifications */}
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>

                {/* Settings */}
                <Link href="/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
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
