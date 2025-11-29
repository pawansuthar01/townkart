"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { RiderSidebar } from "@/components/rider/RiderSidebar";
import { RiderHeader } from "@/components/rider/RiderHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function RiderLayout({
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

  return (
    <ProtectedRoute requiredRoles={["RIDER"]}>
      <div className="min-h-screen bg-gray-50">
        <RiderHeader
          onMenuClick={() => setSidebarOpen(true)}
          isMenuOpen={sidebarOpen}
        />
        <div className="flex">
          <RiderSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
