"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession, useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Eye, EyeOff, Mail, Lock, ShoppingCart } from "lucide-react";
import { hashPassword } from "@/lib/auth";
import { DeviceSelectionModal } from "./DeviceSelectionModal";

export function LoginForm() {
  const [formData, setFormData] = useState({
    identifier: "", // Can be email or phone number
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [existingDevices, setExistingDevices] = useState<any[]>([]);
  const [currentUserInfo, setCurrentUserInfo] = useState<any>(null);

  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user) {
        const activeRole = (session.user as any)?.activeRole;
        if (activeRole === "ADMIN") {
          router.push("/admin/dashboard");
        } else if (activeRole === "STORE_MANAGER") {
          router.push("/store");
        } else if (activeRole === "RIDER") {
          router.push("/rider");
        } else {
          router.push("/");
        }
      } else {
        console.log("Invalid session detected, signing out...");
        signOut({ redirect: false });
      }
    }
  }, [session, status, router]);
  const handleInputChange = async (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // First, check if OTP is required
      const otpCheckResponse = await fetch("/api/auth/check-otp-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });
      if (!otpCheckResponse.ok) {
        const errorData = await otpCheckResponse.json();
        setError(errorData.message || "Invalid credentials");
        return;
      }

      const otpCheckData = await otpCheckResponse.json();
      console.log(otpCheckData);
      if (!otpCheckData.success) {
        // Check if device selection is required
        if (otpCheckData.requiresDeviceSelection) {
          setCurrentUserInfo(otpCheckData.userInfo);
          setExistingDevices(otpCheckData.existingDevices || []);
          setShowDeviceModal(true);
          return;
        }

        setError(otpCheckData.message || "Invalid credentials");
        return;
      }

      // Show message if provided (for phone verification requirements)
      if (otpCheckData.message) {
        setError(otpCheckData.message);
        // Don't return here - continue with redirect logic
      }

      if (otpCheckData.requiresPhoneVerification) {
        console.log("Redirecting to phone verification with data:", {
          phone: otpCheckData.phoneNumber,
          purpose: otpCheckData.purpose,
          userId: otpCheckData.userId,
        });

        // Show message briefly before redirect if provided
        if (otpCheckData.message) {
          setError(otpCheckData.message);
          // Redirect after showing message
          setTimeout(() => {
            router.push(
              `/auth/verify-otp?phone=${encodeURIComponent(otpCheckData.phoneNumber)}&purpose=${otpCheckData.purpose}&userId=${otpCheckData.userId}`
            );
          }, 1500);
        } else {
          // Redirect immediately
          router.push(
            `/auth/verify-otp?phone=${encodeURIComponent(otpCheckData.phoneNumber)}&purpose=${otpCheckData.purpose}&userId=${otpCheckData.userId}`
          );
        }
        console.log("Router push scheduled/called for phone verification");
        return;
      }

      if (otpCheckData.requiresOTP) {
        console.log("Redirecting to OTP verification for login");
        // Redirect to OTP verification for login
        router.push(
          `/auth/verify-otp?phone=${encodeURIComponent(otpCheckData.phoneNumber)}&purpose=LOGIN&userId=${otpCheckData.userId}`
        );
        return;
      }

      // No OTP required - proceed with normal login

      try {
        const result = await signIn("credentials", {
          userInfo: JSON.stringify(otpCheckData.userInfo),
          identifier: formData.identifier,
          password: formData.password,
          rememberMe,
          redirect: false,
        });

        console.log("signIn result:", result);

        if (result?.error) {
          console.error("signIn returned error:", result.error);

          // Check if it's a device selection error
          try {
            const errorData = JSON.parse(result.error);
            if (errorData.requiresDeviceSelection) {
              setCurrentUserInfo(otpCheckData.userInfo);
              setExistingDevices(errorData.existingDevices || []);
              setShowDeviceModal(true);
              return;
            }
          } catch (parseError) {
            // Not a JSON error, treat as regular error
          }

          if (result.error === "CredentialsSignin") {
            setError("Invalid email/phone number or password");
          } else if (result.error.includes("rate limit")) {
            setError("Too many login attempts. Please try again later.");
          } else {
            setError(result.error);
          }
          return;
        }

        if (result?.ok) {
          console.log("signIn successful, getting session...");
          // Get session to check user role for redirection
          console.log("Session after login:", session);
          const activeRole = (session?.user as any)?.activeRole;

          console.log("Redirecting based on role:", activeRole);
          // Redirect based on user role
          if (activeRole === "ADMIN") {
            router.push("/admin/dashboard");
          } else if (activeRole === "STORE_MANAGER") {
            router.push("/store");
          } else if (activeRole === "RIDER") {
            router.push("/rider");
          } else {
            router.push("/");
          }
          router.refresh();
        } else {
          console.warn("signIn result not ok:", result);
          setError("Login failed. Please try again.");
        }
      } catch (e) {
        console.log(e);
      }
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceLogoutSuccess = async () => {
    setShowDeviceModal(false);

    // Now proceed with login since devices have been logged out
    try {
      const result = await signIn("credentials", {
        userInfo: JSON.stringify(currentUserInfo),
        identifier: formData.identifier,
        password: formData.password,
        rememberMe,
        redirect: false,
      });

      if (result?.ok) {
        // Success - redirect will happen via useEffect
      } else {
        setError(result?.error || "Login failed after device logout.");
      }
    } catch (signInError: any) {
      console.error("Sign in error:", signInError);
      setError(signInError.message || "Sign in failed");
    }
  };

  const handleDeviceModalCancel = () => {
    setShowDeviceModal(false);
    setError("Device selection cancelled. Please try logging in again.");
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        setError("Google sign-in failed. Please try again.");
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error: any) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-townkart-primary/5 via-white to-townkart-secondary/5 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-townkart-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-townkart-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-purple-400/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm transition-all duration-300 relative">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="mx-auto w-16 h-16 bg-townkart-primary/10 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-townkart-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to your TownKart account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email or Phone Number
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter your email or phone number (+919876543210)"
                value={formData.identifier}
                onChange={(e) =>
                  handleInputChange("identifier", e.target.value)
                }
                required
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  disabled={isLoading}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={isLoading}
                />
                Remember me
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          {/* Google OAuth Button */}
          <div className="mt-6">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-11 border-gray-300 hover:bg-gray-50"
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-blue-600 hover:text-blue-500 font-semibold"
              >
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Device Selection Modal */}
      <DeviceSelectionModal
        isOpen={showDeviceModal}
        devices={existingDevices}
        userId={currentUserInfo?.id}
        onSuccess={handleDeviceLogoutSuccess}
        onCancel={handleDeviceModalCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
