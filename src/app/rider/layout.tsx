"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RiderSidebar } from "@/components/rider/RiderSidebar";
import { LocationPermissionEnforcer } from "@/components/rider/LocationPermissionEnforcer";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fullScreenPages = ["/rider/waiting", "/rider/setup"];

  if (fullScreenPages.includes(pathname)) {
    return (
      <ProtectedRoute requiredRoles={["RIDER"]}>
        <div className="min-h-screen bg-gray-50">{children}</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={["RIDER"]}>
      <div className="min-h-screen flex bg-gray-50">
        <RiderSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1">
          <LocationPermissionEnforcer requireContinuousTracking />

          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold">Rider Panel</span>
          </div>

          <main className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
