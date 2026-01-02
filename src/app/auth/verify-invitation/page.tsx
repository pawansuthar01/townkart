"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { CheckCircle, AlertTriangle, Phone, Mail } from "lucide-react";

export default function VerifyInvitationPage() {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    } else {
      setError("Invalid verification link");
      setIsLoading(false);
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(
        `/api/auth/get-invitation-user?userId=${userId}`
      );
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setError("Failed to load user details");
      }
    } catch (error) {
      setError("Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          phoneNumber: user.phoneNumber,
          purpose: "PHONE_VERIFICATION",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess("OTP sent successfully to your phone number");
        setError("");
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (error) {
      setError("Failed to send OTP");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/verify-invitation-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          otp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(
          "Phone number verified successfully! Your account is now active."
        );
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (error) {
      setError("Failed to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Verification Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")} className="w-full mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Phone className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Verify Your Phone Number</CardTitle>
          <CardDescription>
            Complete your registration by verifying your phone number
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {user && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Email Verified</span>
                </div>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">
                    Phone Verification Required
                  </span>
                </div>
                <p className="text-sm text-gray-600">{user.phoneNumber}</p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 4-digit OTP"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    maxLength={4}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the OTP sent to your phone number
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || otp.length !== 4}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Phone Number"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={handleSendOTP}
                  disabled={isSubmitting}
                >
                  Resend OTP
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
