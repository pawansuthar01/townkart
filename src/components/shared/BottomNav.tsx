"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  Search,
  ShoppingBag,
  User,
  Store,
  Bike,
  BarChart3,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { getCartSummary } = useCart();
  const cartSummary = getCartSummary();

  const getNavItems = () => {
    if (!user) {
      return [
        { href: "/", icon: Home, label: "Home" },
        { href: "/search", icon: Search, label: "Search" },
        {
          href: "/cart",
          icon: ShoppingBag,
          label: "Cart",
          badge: cartSummary.itemCount,
        },
        { href: "/auth/login", icon: User, label: "Account" },
      ];
    }

    switch (user.activeRole) {
      case "MERCHANT":
        return [
          { href: "/merchant", icon: Home, label: "Dashboard" },
          { href: "/merchant/products", icon: Store, label: "Products" },
          { href: "/merchant/orders", icon: ShoppingBag, label: "Orders" },
          { href: "/merchant/analytics", icon: BarChart3, label: "Analytics" },
        ];
      case "RIDER":
        return [
          { href: "/rider", icon: Home, label: "Dashboard" },
          { href: "/rider/deliveries", icon: Bike, label: "Deliveries" },
          { href: "/rider/earnings", icon: BarChart3, label: "Earnings" },
          { href: "/profile", icon: User, label: "Profile" },
        ];
      default: // CUSTOMER
        return [
          { href: "/", icon: Home, label: "Home" },
          { href: "/search", icon: Search, label: "Search" },
          { href: "/orders", icon: ShoppingBag, label: "Orders" },
          { href: "/profile", icon: User, label: "Profile" },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <Button
                variant="ghost"
                className={`w-full h-12 flex flex-col items-center justify-center space-y-1 relative ${
                  isActive
                    ? "text-townkart-primary bg-townkart-primary/10"
                    : "text-gray-600 hover:text-townkart-primary hover:bg-gray-50"
                }`}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs bg-townkart-primary">
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
