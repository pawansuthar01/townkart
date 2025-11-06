"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallbackPath = "/auth/login",
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      router.push(fallbackPath);
      return;
    }

    // Check role-based access
    if (requiredRole && requiredRole.length > 0) {
      const userRole = session.user?.activeRole;
      if (!userRole || !requiredRole.includes(userRole)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [session, status, requiredRole, router, fallbackPath]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  // Check role-based access for rendering
  if (requiredRole && requiredRole.length > 0) {
    const userRole = session.user?.activeRole;
    if (!userRole || !requiredRole.includes(userRole)) {
      return null; // Will redirect
    }
  }

  return <>{children}</>;
}
