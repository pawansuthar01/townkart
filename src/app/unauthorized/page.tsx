"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Home, LogOut, AlertTriangle, Phone } from "lucide-react";
import { signOut } from "next-auth/react";

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  const getContent = () => {
    switch (reason) {
      case "account_inactive":
        return {
          icon: <AlertTriangle className="h-8 w-8 text-orange-600" />,
          iconBg: "bg-orange-100",
          title: "Account Deactivated",
          description: "Your account has been deactivated",
          message:
            "Your account has been deactivated. Send OTP to your phone number to reactivate your account.",
          bgGradient: "from-orange-50 to-red-100",
        };
      case "phone_unverified":
        return {
          icon: <Phone className="h-8 w-8 text-blue-600" />,
          iconBg: "bg-blue-100",
          title: "Phone Verification Required",
          description: "Please verify your phone number to continue",
          message:
            "You need to verify your phone number before accessing the application.",
          bgGradient: "from-blue-50 to-indigo-100",
        };
      default:
        return {
          icon: <Shield className="h-8 w-8 text-red-600" />,
          iconBg: "bg-red-100",
          title: "Access Denied",
          description: "You don't have permission to access this page",
          message:
            "This page requires specific permissions that your account doesn't have. Please contact an administrator if you believe this is an error.",
          bgGradient: "from-red-50 to-orange-100",
        };
    }
  };

  const content = getContent();

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${content.bgGradient} flex items-center justify-center p-4`}
    >
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${content.iconBg}`}>
              {content.icon}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {content.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {content.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center text-gray-700">{content.message}</p>

          <div className="space-y-3">
            {reason === "phone_unverified" || reason === "account_inactive" ? (
              <Link href="/verify-otp" className="block">
                <Button className="w-full" variant="default">
                  <Phone className="mr-2 h-4 w-4" />
                  {reason === "account_inactive"
                    ? "Reactivate Account"
                    : "Verify Phone Number"}
                </Button>
              </Link>
            ) : (
              <Link href="/" className="block">
                <Button className="w-full" variant="default">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </Link>
            )}

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
