"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { RiderSidebar } from "@/components/rider/RiderSidebar";
import { RiderMobileHeader } from "@/components/rider/RiderMobileHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LocationPermissionEnforcer } from "@/components/rider/LocationPermissionEnforcer";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    const user = session?.user as any;
    const hasRiderProfile = user?.riderProfile;

    // Allow access to waiting page
    if (pathname === "/rider/waiting") return;

    // If user is RIDER but has no rider profile, redirect to waiting
    if (user?.activeRole === "RIDER" && !hasRiderProfile) {
      router.push("/rider/waiting");
      return;
    }

    // If user has rider profile but is on waiting page, redirect to dashboard
    if (hasRiderProfile && pathname === "/rider/waiting") {
      router.push("/rider");
      return;
    }
  }, [session, status, pathname, router]);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
        {/* Sidebar - Mobile */}
        <RiderSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <div className="flex-1 ">
          {/* Location Permission Enforcer - Always active for riders */}
          <div className="">
            <LocationPermissionEnforcer
              requireContinuousTracking={false}
              onPermissionDenied={() => {
                // Could redirect to permission help page
                console.log("Location permission denied");
              }}
              onLocationLost={() => {
                // Could show location recovery instructions
                console.log("Location lost");
              }}
            />
          </div>

          {/* Mobile Header with Menu Button */}
          <div className="">
            <div className="flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-200/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-townkart-primary to-townkart-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  Rider Panel
                </span>
              </div>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
