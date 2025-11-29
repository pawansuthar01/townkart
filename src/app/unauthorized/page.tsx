"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Home, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center text-gray-700">
            This page requires specific permissions that your account doesn't
            have. Please contact an administrator if you believe this is an
            error.
          </p>

          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full" variant="default">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </Link>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
