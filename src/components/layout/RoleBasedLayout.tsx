"use client";

import { ReactNode, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/shared/BottomNav";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";
import { CustomerSidebar } from "@/components/customer/CustomerSidebar";
import { RiderHeader } from "@/components/rider/RiderHeader";
import { RiderSidebar } from "@/components/rider/RiderSidebar";
import { MerchantHeader } from "@/components/merchant/MerchantHeader";
import { MerchantSidebar } from "@/components/merchant/MerchantSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useState } from "react";

interface RoleBasedLayoutProps {
  children: ReactNode;
}

export function RoleBasedLayout({ children }: RoleBasedLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNotFound, setIsNotFound] = useState(false);
  const userRole = (session?.user as any)?.activeRole;

  const isAuthPage =
    pathname?.startsWith("/auth/") ||
    pathname?.startsWith("/verify-otp") ||
    isNotFound;
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-townkart-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Role-specific layouts
  switch (userRole) {
    case "CUSTOMER":
      return (
        <div className="min-h-screen bg-gray-50">
          <CustomerHeader
            onMenuClick={() => setSidebarOpen(true)}
            isMenuOpen={sidebarOpen}
          />
          <div className="flex">
            <CustomerSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <main className="flex-1 md:ml-64 ">{children}</main>
          </div>
          <CustomerFooter />
        </div>
      );

    case "RIDER":
      return <>{children}</>;

    case "STORE_MANAGER":
      // Store manager uses its own layout in the store directory
      return <>{children}</>;

    case "ADMIN":
      return (
        <div className="min-h-screen bg-gray-50 overflow-auto">
          <AdminHeader
            onMenuClick={() => setSidebarOpen(true)}
            isMenuOpen={sidebarOpen}
          />
          <div className="flex">
            <AdminSidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <main className="flex-1 px-6 py-2 pt-24 md:pt-28">{children}</main>
          </div>
        </div>
      );

    default:
      return (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="pt-24 md:pt-28">{children}</main>
          <div className="hidden md:block">
            <Footer />
          </div>
          <BottomNav />
        </div>
      );
  }
}
