"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Smartphone,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Clock,
  Send,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSession, signIn } from "next-auth/react";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: session, status } = useSession();
  // Get phone number from URL params or user data
  const phoneNumber = searchParams.get("phone") || user?.phoneNumber || "";
  // Determine purpose based on user state
  const purpose =
    searchParams.get("purpose") ||
    (user && !user.isActive
      ? "ACCOUNT_REACTIVATION"
      : user && !user.phoneVerified
        ? "PHONE_VERIFICATION"
        : "LOGIN");
  const redirect = searchParams.get("redirect") || "/";

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Detect device information
  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          ua
        );
      const isTablet = /iPad|Android(?=.*\bMobile\b)|Tablet/i.test(ua);

      let deviceType = "desktop";
      if (isTablet) deviceType = "tablet";
      else if (isMobile) deviceType = "mobile";

      // Generate device fingerprint
      const fingerprint = btoa(
        navigator.userAgent +
          screen.width +
          screen.height +
          new Date().getTime()
      ).substring(0, 32);

      const deviceData = {
        deviceId: fingerprint,
        deviceName: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} Device`,
        deviceType,
        os: getOS(ua),
        browser: getBrowser(ua),
        fingerprint,
      };

      setDeviceInfo(deviceData);
    };

    const getOS = (ua: string) => {
      if (ua.includes("Windows")) return "Windows";
      if (ua.includes("Mac")) return "macOS";
      if (ua.includes("Linux")) return "Linux";
      if (ua.includes("Android")) return "Android";
      if (ua.includes("iOS")) return "iOS";
      return "Unknown";
    };

    const getBrowser = (ua: string) => {
      if (ua.includes("Chrome")) return "Chrome";
      if (ua.includes("Firefox")) return "Firefox";
      if (ua.includes("Safari")) return "Safari";
      if (ua.includes("Edge")) return "Edge";
      return "Unknown";
    };

    detectDevice();
  }, []);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (!phoneNumber) {
      setError("Phone number is required");
      return;
    }

    setIsSendingOTP(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          purpose,
          action: "send",
          deviceInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setSuccess("OTP sent successfully to your phone");
        setResendTimer(60); // 60 seconds cooldown
        setOtpExpiry(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes expiry
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      setError("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 4) {
      setError("Please enter a valid 4-digit OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          otp,
          purpose,
          action: "verify",
          deviceInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Phone number verified successfully!");

        // Sign in with NextAuth to update session only for LOGIN/REGISTER
        if (data.data?.accessToken) {
          try {
            await signIn("otp", {
              phoneNumber,
              otp,
              redirect: false,
            });
          } catch (signInError) {
            console.error("Sign in error:", signInError);
          }
        }

        // Redirect after successful verification
        setTimeout(() => {
          router.push(redirect);
        }, 2000);
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtp = otp.split("");
    newOtp[index] = value;
    setOtp(newOtp.join(""));

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
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

      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/auth/login">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm transition-all duration-300">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-townkart-primary/10 rounded-full flex items-center justify-center mb-4">
              {otpSent ? (
                <Smartphone className="h-8 w-8 text-townkart-primary" />
              ) : (
                <Send className="h-8 w-8 text-townkart-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {otpSent ? "Verify Your Phone" : "Send Verification Code"}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {otpSent ? (
                <>
                  We've sent a 4-digit code to
                  <br />
                  <span className="font-semibold text-gray-900">
                    +91 {phoneNumber.slice(-4).padStart(10, "*")}
                  </span>
                </>
              ) : (
                "We'll send a 4-digit verification code to your registered phone number"
              )}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input */}
            {otpSent && (
              <div className="space-y-4">
                <div className="flex justify-center space-x-2 flex-wrap gap-y-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={otp[index] || ""}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 focus:border-townkart-primary focus:ring-townkart-primary"
                      disabled={isLoading}
                    />
                  ))}
                </div>

                {/* OTP Status */}
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Code expires in{" "}
                      {otpExpiry
                        ? Math.max(
                            0,
                            Math.floor(
                              (otpExpiry.getTime() - Date.now()) / 1000 / 60
                            )
                          )
                        : 10}{" "}
                      minutes
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Main Action Button */}
            {otpSent ? (
              <Button
                onClick={handleVerifyOTP}
                disabled={otp.length !== 4 || isLoading}
                className="w-full townkart-gradient hover:opacity-90 text-white font-semibold py-3 h-auto"
                size="lg"
              >
                {isAuthLoading ? (
                  <>loading</>
                ) : isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify OTP
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSendOTP}
                disabled={isSendingOTP}
                className="w-full townkart-gradient hover:opacity-90 text-white font-semibold py-3 h-auto"
                size="lg"
              >
                {isSendingOTP ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send OTP
                  </>
                )}
              </Button>
            )}

            {/* Resend OTP */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Didn't receive the code?</p>
              <Button
                variant="ghost"
                onClick={handleSendOTP}
                disabled={isSendingOTP || resendTimer > 0}
                className="text-townkart-primary hover:text-townkart-primary/80 font-medium"
              >
                {isSendingOTP ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : resendTimer > 0 ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend in {resendTimer}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend OTP
                  </>
                )}
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-center pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>
                  Your phone number is secured with end-to-end encryption
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  );
}
