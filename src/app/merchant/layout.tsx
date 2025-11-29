"use client";

import { useState } from "react";
import { MerchantSidebar } from "@/components/merchant/MerchantSidebar";
import { MerchantHeader } from "@/components/merchant/MerchantHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute requiredRoles={["MERCHANT"]}>
      <div className="min-h-screen bg-gray-50">
        <MerchantHeader
          onMenuClick={() => setSidebarOpen(true)}
          isMenuOpen={sidebarOpen}
        />
        <div className="flex">
          <MerchantSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
