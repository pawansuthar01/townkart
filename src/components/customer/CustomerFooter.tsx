import Link from "next/link";
import {
  ShoppingCart,
  MapPin,
  Heart,
  User,
  Home,
  Search,
  Bell,
  ShoppingBag,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function CustomerFooter() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      {/* Desktop Footer */}
      <footer className="hidden md:block bg-gray-900 text-white py-8 px-4">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="townkart-gradient p-2 rounded">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">TownKart</span>
              </div>
              <p className="text-gray-400 text-sm">
                Making local commerce easy, fast, and reliable for everyone in
                your neighborhood.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link
                    href="/shops"
                    className="hover:text-white transition-colors"
                  >
                    Browse Shops
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categories"
                    className="hover:text-white transition-colors"
                  >
                    Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/offers"
                    className="hover:text-white transition-colors"
                  >
                    Offers & Deals
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-white transition-colors"
                  >
                    Help & Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">My Account</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link
                    href="/customer/profile"
                    className="hover:text-white transition-colors"
                  >
                    My Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer/orders"
                    className="hover:text-white transition-colors"
                  >
                    Order History
                  </Link>
                </li>
                <li>
                  <Link
                    href="/wishlist"
                    className="hover:text-white transition-colors"
                  >
                    Wishlist
                  </Link>
                </li>
                <li>
                  <Link
                    href="/customer/addresses"
                    className="hover:text-white transition-colors"
                  >
                    Addresses
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Contact & Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>📧 support@townkart.com</li>
                <li>📱 +91 98765 43210</li>
                <li>🏢 Bangalore, Karnataka</li>
                <li>🕒 24/7 Customer Support</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400 text-sm">
            <p>
              &copy; 2024 TownKart. All rights reserved. Made with ❤️ for local
              communities.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div
          className={`grid ${isAuthenticated ? "grid-cols-5" : "grid-cols-4"} h-16`}
        >
          <Link
            href="/"
            className="flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-townkart-primary transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Link>

          <Link
            href="/categories"
            className="flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-townkart-primary transition-colors"
          >
            <Search className="h-5 w-5" />
            <span className="text-xs">Categories</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href="/cart"
                className="flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-townkart-primary transition-colors relative"
              >
                <ShoppingBag className="h-5 w-5" />
                <span className="text-xs">Cart</span>
              </Link>

              <Link
                href="/wishlist"
                className="flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-townkart-primary transition-colors"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs">Wishlist</span>
              </Link>

              <Link
                href="/customer/profile"
                className="flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-townkart-primary transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="text-xs">Profile</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-townkart-primary transition-colors"
              >
                <LogIn className="h-5 w-5" />
                <span className="text-xs">Login</span>
              </Link>

              <Link
                href="/auth/register"
                className="flex flex-col items-center justify-center space-y-1 text-townkart-primary hover:text-townkart-primary/80 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                <span className="text-xs">Sign Up</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Spacer */}
      <div className="md:hidden h-16" style={{ height: "4rem" }}></div>
    </>
  );
}
