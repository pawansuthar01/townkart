"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Clock,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
} from "lucide-react";

interface Device {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  os?: string;
  browser?: string;
  lastLoginAt: string;
  lastIP: string;
  lastLocation?: {
    city?: string;
    region?: string;
    country?: string;
  };
  batteryLevel?: number;
  loginCount: number;
}

interface DeviceSelectionModalProps {
  devices: Device[];
  onDeviceSelect: (deviceId: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeviceSelectionModal({
  devices,
  onDeviceSelect,
  onCancel,
  isLoading = false,
}: DeviceSelectionModalProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
      case "smartphone":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      case "desktop":
      case "computer":
        return <Monitor className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleRequestOTP = async () => {
    if (!selectedDeviceId) {
      setError("Please select a device to logout");
      return;
    }

    setOtpLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/device-logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "request_otp",
          deviceId: selectedDeviceId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setShowOTPInput(true);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (error) {
      setError("Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }

    setOtpLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/device-logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify_otp",
          deviceId: selectedDeviceId,
          otp,
          phoneNumber: "", // Will be filled from session
        }),
      });

      const data = await response.json();

      if (data.success) {
        onDeviceSelect(selectedDeviceId);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (error) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Multiple Device Login Detected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">
                  Single Device Policy
                </h3>
                <p className="text-sm text-orange-800">
                  As a rider, you can only be logged in from one device at a
                  time. Please select which device to logout from to continue
                  with your login.
                </p>
              </div>
            </div>
          </div>

          {/* Device List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Select a device to logout from:
            </h3>
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.deviceId}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDeviceId === device.deviceId
                      ? "border-townkart-primary bg-townkart-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedDeviceId(device.deviceId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.deviceType)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {device.deviceName ||
                              `${device.deviceType} ${device.os ? `(${device.os})` : ""}`}
                          </span>
                          {selectedDeviceId === device.deviceId && (
                            <CheckCircle className="h-4 w-4 text-townkart-primary" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last login: {formatLastLogin(device.lastLoginAt)}
                          </div>
                          {device.lastLocation && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {device.lastLocation.city},{" "}
                              {device.lastLocation.region}
                            </div>
                          )}
                          <div>Logins: {device.loginCount}</div>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">{device.deviceType}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* OTP Section */}
          {selectedDeviceId && (
            <div className="border-t pt-6">
              {!showOTPInput ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    To logout from the selected device, we'll send an OTP to
                    your registered phone number for verification.
                  </p>
                  <Button
                    onClick={handleRequestOTP}
                    disabled={otpLoading}
                    className="bg-townkart-primary hover:bg-townkart-primary/90"
                  >
                    {otpLoading && (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Send OTP to Verify
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600 mb-4">
                      OTP sent to your registered phone number. Enter it below
                      to complete the device logout.
                    </p>
                  </div>

                  <div className="max-w-xs mx-auto">
                    <Input
                      type="text"
                      placeholder="Enter 4-digit OTP"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  {error && (
                    <p className="text-red-600 text-center text-sm">{error}</p>
                  )}

                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowOTPInput(false);
                        setOtp("");
                        setError("");
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyOTP}
                      disabled={otpLoading || otp.length < 4}
                      className="bg-townkart-primary hover:bg-townkart-primary/90"
                    >
                      {otpLoading && (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Verify & Logout Device
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && !showOTPInput && (
            <p className="text-red-600 text-center text-sm">{error}</p>
          )}

          {/* Cancel Button */}
          <div className="flex justify-center pt-4 border-t">
            <Button variant="ghost" onClick={onCancel}>
              Cancel Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
