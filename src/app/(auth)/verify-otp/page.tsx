"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OTPInput } from "@/components/auth/OTPInput";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  ShoppingCart,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Smartphone,
  RefreshCw,
} from "lucide-react";

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const role = searchParams.get("role") as "customer" | "merchant" | "rider";
  const action = searchParams.get("action") as "login" | "register";

  // Timer for resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOTPSubmit = async (otpValue: string) => {
    if (otpValue.length !== 4) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone,
          otp: otpValue,
          role,
          action: action || "login",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "OTP verification failed");
      }

      setSuccess("OTP verified successfully! Redirecting...");

      // Redirect based on role
      setTimeout(() => {
        switch (role) {
          case "customer":
            router.push("/dashboard");
            break;
          case "merchant":
            router.push("/merchant-dashboard");
            break;
          case "rider":
            router.push("/rider-dashboard");
            break;
          default:
            router.push("/dashboard");
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint =
        action === "register" ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to resend OTP");
      }

      setSuccess("OTP resent successfully!");
      setResendTimer(30);
      setCanResend(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (value: string) => {
    setOtp(value);
    if (value.length === 4) {
      handleOTPSubmit(value);
    }
  };

  if (!phone || !role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invalid Access
              </h2>
              <p className="text-gray-600 mb-4">
                Please go back and enter your phone number first.
              </p>
              <Link href="/auth/login">
                <Button>Go to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="townkart-gradient p-2 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">TownKart</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Verify Your Phone</CardTitle>
              <CardDescription>
                We've sent a 4-digit code to
                <br />
                <span className="font-medium text-gray-900">{phone}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* OTP Input */}
              <div className="space-y-4">
                <OTPInput
                  value={otp}
                  onChange={handleOTPChange}
                  disabled={isLoading}
                />

                <p className="text-sm text-gray-600 text-center">
                  Enter the 4-digit code sent to your phone
                </p>
              </div>

              {/* Resend OTP */}
              <div className="text-center">
                {canResend ? (
                  <Button
                    variant="ghost"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-townkart-primary hover:text-townkart-secondary"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend OTP
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Resend OTP in {resendTimer} seconds
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleOTPSubmit(otp)}
                  disabled={otp.length !== 4 || isLoading}
                  className="w-full btn-primary"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>

              {/* Help */}
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Didn't receive the code? Check your spam folder or{" "}
                  <a
                    href="/support"
                    className="text-townkart-primary hover:underline"
                  >
                    contact support
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role Information */}
          <Card className="mt-6 bg-gradient-to-r from-townkart-primary/5 to-townkart-secondary/5 border-townkart-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-2 mb-3">
                <Smartphone className="h-5 w-5 text-townkart-primary" />
                <span className="font-medium text-gray-900 capitalize">
                  {role} Verification
                </span>
              </div>
              <p className="text-sm text-gray-600 text-center">
                {role === "customer" &&
                  "Complete verification to start shopping from local stores"}
                {role === "merchant" &&
                  "Verify your account to start managing your store"}
                {role === "rider" &&
                  "Complete verification to start accepting deliveries"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
