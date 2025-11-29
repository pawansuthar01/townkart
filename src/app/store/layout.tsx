"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { StoreSidebar } from "@/components/store/StoreSidebar";
import { StoreHeader } from "@/components/store/StoreHeader";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") return;

    const user = session?.user as any;
    const hasStoreData = user?.storeData;

    // Allow access to waiting page
    if (pathname === "/store/waiting") return;

    // If user is STORE_MANAGER but has no store assigned, redirect to waiting
    if (user?.activeRole === "STORE_MANAGER" && !hasStoreData) {
      router.push("/store/waiting");
      return;
    }

    // If user has store data but is on waiting page, redirect to dashboard
    if (hasStoreData && pathname === "/store/waiting") {
      router.push("/store");
      return;
    }
  }, [session, status, pathname, router]);

  // Show loading while checking
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-townkart-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader
        onMenuClick={() => setSidebarOpen(true)}
        isMenuOpen={sidebarOpen}
      />
      <div className="flex">
        <StoreSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
