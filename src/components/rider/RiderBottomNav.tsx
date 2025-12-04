"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bike,
  DollarSign,
  BarChart3,
  User,
  MapPin,
  Bell,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Home",
    href: "/rider",
    icon: Home,
  },
  {
    title: "Deliveries",
    href: "/rider/deliveries",
    icon: Bike,
  },
  {
    title: "Earnings",
    href: "/rider/earnings",
    icon: DollarSign,
  },
  {
    title: "Analytics",
    href: "/rider/analytics",
    icon: BarChart3,
  },
  {
    title: "Profile",
    href: "/rider/profile",
    icon: User,
  },
];

export function RiderBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1",
                isActive
                  ? "bg-townkart-primary text-white shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-townkart-primary hover:bg-gray-50"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 mb-1",
                  isActive ? "text-white" : "text-current"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium truncate",
                  isActive ? "text-white" : "text-current"
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Safe area for iOS devices */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </div>
  );
}
