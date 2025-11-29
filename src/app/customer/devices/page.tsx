"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Battery,
  Clock,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Device {
  id: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string;
  os: string | null;
  browser: string | null;
  lastLoginAt: string;
  lastIP: string;
  lastLocation: any;
  batteryLevel: number | null;
  loginCount: number;
  isActive: boolean;
  isTrusted: boolean;
}

export default function CustomerDevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/devices");
      const data = await response.json();

      if (data.success) {
        setDevices(data.data.devices);
      } else {
        alert(data.message || "Failed to fetch devices");
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      alert("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  const handleRemoveDevice = async (deviceId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this device? You will be logged out from this device.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/users/devices", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Device removed successfully");
        fetchDevices();
      } else {
        alert(data.message || "Failed to remove device");
      }
    } catch (error) {
      console.error("Error removing device:", error);
      alert("Failed to remove device");
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-6 w-6" />;
      case "tablet":
        return <Tablet className="h-6 w-6" />;
      default:
        return <Monitor className="h-6 w-6" />;
    }
  };

  const formatLocation = (location: any) => {
    if (!location) return "Unknown";
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    return parts.join(", ") || "Unknown";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please login to view your devices</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Devices</h1>
              <p className="text-gray-600 mt-1">
                Manage devices that have access to your account
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Security Notice */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-900 mb-1">
                  Security Notice
                </h3>
                <p className="text-sm text-orange-800">
                  Only keep devices you recognize and trust. Remove any
                  unfamiliar devices immediately. If you see suspicious
                  activity, change your password and contact support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Devices
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {devices.length}
                  </p>
                </div>
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Devices
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {devices.filter((d) => d.isActive).length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Trusted Devices
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {devices.filter((d) => d.isTrusted).length}
                  </p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Devices List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading devices...</span>
          </div>
        ) : devices.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No devices found
              </h3>
              <p className="text-gray-600">
                Your device information will appear here once you log in
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <Card key={device.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        {getDeviceIcon(device.deviceType)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {device.deviceName || `${device.deviceType} device`}
                          </h3>
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                device.isActive ? "default" : "secondary"
                              }
                              className={
                                device.isActive
                                  ? "bg-green-100 text-green-800"
                                  : ""
                              }
                            >
                              {device.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {device.isTrusted && (
                              <Badge
                                variant="outline"
                                className="border-green-200 text-green-800"
                              >
                                Trusted
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p>
                              <strong>OS:</strong> {device.os || "Unknown"}
                            </p>
                            <p>
                              <strong>Browser:</strong>{" "}
                              {device.browser || "Unknown"}
                            </p>
                            {device.batteryLevel && (
                              <p className="flex items-center gap-1">
                                <Battery className="h-3 w-3" />
                                <strong>Battery:</strong> {device.batteryLevel}%
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <strong>Location:</strong>{" "}
                              {formatLocation(device.lastLocation)}
                            </p>
                            <p>
                              <strong>IP:</strong> {device.lastIP}
                            </p>
                            <p className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <strong>Last Login:</strong>{" "}
                              {formatDate(device.lastLoginAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-sm text-gray-500">
                            Login count: {device.loginCount}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {device.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveDevice(device.deviceId)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove Device
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Text */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Device Security Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>
              • <strong>Regular Check:</strong> Review your devices periodically
              and remove any you don't recognize.
            </p>
            <p>
              • <strong>Location Monitoring:</strong> If you see logins from
              unexpected locations, change your password immediately.
            </p>
            <p>
              • <strong>Trusted Devices:</strong> Mark frequently used devices
              as trusted for easier access.
            </p>
            <p>
              • <strong>Two-Factor Authentication:</strong> Enable 2FA for
              additional security (coming soon).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
