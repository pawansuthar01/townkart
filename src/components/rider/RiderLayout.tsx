"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import LocationPermissionBanner from "@/components/rider/LocationPermissionBanner";

interface RiderLayoutProps {
  children: ReactNode;
}

export default function RiderLayout({ children }: RiderLayoutProps) {
  const { user } = useAuth();

  // Only show location banner for riders
  const showLocationBanner = user?.activeRole === "RIDER";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Location Permission Banner for Riders */}
      {showLocationBanner && <LocationPermissionBanner />}

      {/* Page Content */}
      {children}
    </div>
  );
}
