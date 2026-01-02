"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Store,
  Bike,
  BarChart3,
  Settings,
  Shield,
  Gift,
  MapPin,
  Bell,
  Mail,
  FileText,
  Truck,
  Monitor,
  Smartphone,
  Clock,
  User,
  Globe,
  Cog,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Destination Analytics",
    href: "/admin/destination-analytics",
    icon: TrendingUp,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Applications",
    href: "/admin/applications",
    icon: FileText,
  },
  {
    title: "Invitations",
    href: "/admin/invitations",
    icon: Mail,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Stores",
    href: "/admin/stores",
    icon: Store,
  },
  {
    title: "Riders",
    href: "/admin/riders",
    icon: Bike,
  },
  {
    title: "Rider Locations",
    href: "/admin/rider-locations",
    icon: MapPin,
  },
  {
    title: "Delivery Monitoring",
    href: "/admin/delivery-monitoring",
    icon: Truck,
  },
  {
    title: "Delivery Charges",
    href: "/admin/delivery-charges",
    icon: CreditCard,
  },
  {
    title: "Service Areas",
    href: "/admin/service-areas",
    icon: Globe,
  },
  {
    title: "Offers",
    href: "/admin/offers",
    icon: Gift,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Notification Logs",
    href: "/admin/notification-logs",
    icon: Clock,
  },
  {
    title: "Notification Settings",
    href: "/admin/notification-settings",
    icon: Settings,
  },
  {
    title: "Devices",
    href: "/admin/devices",
    icon: Smartphone,
  },
  {
    title: "OTP Metrics",
    href: "/admin/otp-metrics",
    icon: Shield,
  },
  {
    title: "Profile",
    href: "/admin/profile",
    icon: User,
  },
  {
    title: "System Settings",
    href: "/admin/system-settings",
    icon: Cog,
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-64 max-w-[280px] bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">
                  Admin Panel
                </span>
              </div>
              <button
                onClick={onClose}
                className=" p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-townkart-primary text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              © 2025 TownKart
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
