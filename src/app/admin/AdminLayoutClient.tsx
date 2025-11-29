"use client";

import { ReactNode, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface AdminLayoutClientProps {
  children: ReactNode;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader
        onMenuClick={() => setSidebarOpen(true)}
        isMenuOpen={sidebarOpen}
      />
      <div className="flex">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
