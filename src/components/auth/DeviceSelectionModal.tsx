"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Shield, Smartphone, Monitor, Tablet, AlertCircle } from "lucide-react";

interface Device {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  os?: string;
  browser?: string;
  lastLoginAt?: string;
  lastIP?: string;
  batteryLevel?: number;
}

interface DeviceSelectionModalProps {
  isOpen: boolean;
  devices: Device[];
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeviceSelectionModal({
  isOpen,
  devices,
  userId,
  onSuccess,
  onCancel,
  isLoading = false,
}: DeviceSelectionModalProps) {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleDeviceSelection = (deviceId: string, checked: boolean) => {
    if (checked) {
      setSelectedDevices([...selectedDevices, deviceId]);
    } else {
      setSelectedDevices(selectedDevices.filter((id) => id !== deviceId));
    }
  };

  const handleLogoutSelectedDevices = async () => {
    if (selectedDevices.length === 0) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/device-logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceIds: selectedDevices,
          userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        console.error("Device logout failed:", data.message);
        // Show error but don't close modal - allow retry
        alert(`Failed to logout devices: ${data.message}. Please try again.`);
      }
    } catch (error) {
      console.error("Device logout error:", error);
      alert("An error occurred while logging out devices. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Device Limit Exceeded</h2>
              <p className="text-sm opacity-90 mt-1">
                Select devices to logout and continue
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-sm text-gray-600 mb-4">
            You've reached the maximum number of active devices. Please select
            which devices to logout from to continue with your login.
          </div>

          {/* Device List */}
          <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-start space-x-3 p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  id={`device-${device.id}`}
                  checked={selectedDevices.includes(device.id)}
                  onCheckedChange={(checked) =>
                    handleDeviceSelection(device.id, checked as boolean)
                  }
                  className="mt-0.5"
                />
                <label
                  htmlFor={`device-${device.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {getDeviceIcon(device.deviceType)}
                    <span className="font-medium text-gray-900 text-sm">
                      {device.deviceType.charAt(0).toUpperCase() +
                        device.deviceType.slice(1)}
                    </span>
                    {device.browser && (
                      <span className="text-xs text-gray-500">
                        • {device.browser}
                      </span>
                    )}
                  </div>
                  {device.os && (
                    <p className="text-xs text-gray-600 mb-1">{device.os}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Last login:{" "}
                      {device.lastLoginAt
                        ? new Date(device.lastLoginAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                    {device.lastIP && <span>IP: {device.lastIP}</span>}
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-12 border-gray-300 hover:bg-gray-50"
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogoutSelectedDevices}
              disabled={
                selectedDevices.length === 0 || isLoggingOut || isLoading
              }
              className="flex-1 h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold"
            >
              {isLoggingOut ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Logging out...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Logout & Continue ({selectedDevices.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
