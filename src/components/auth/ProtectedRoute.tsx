"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
  fallbackPath = "/auth/login",
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Still loading

    if (!isAuthenticated) {
      router.push(fallbackPath);
      return;
    }

    // Check role-based access if required roles are specified
    if (requiredRoles.length > 0) {
      const userRole = user?.activeRole;
      if (!userRole || !requiredRoles.includes(userRole)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [user, isAuthenticated, isLoading, requiredRoles, fallbackPath, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Check role-based access
  if (requiredRoles.length > 0) {
    const userRole = user?.activeRole;
    if (!userRole || !requiredRoles.includes(userRole)) {
      return null; // Will redirect
    }
  }

  return <>{children}</>;
}
