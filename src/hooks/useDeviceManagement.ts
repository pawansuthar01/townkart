"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface Device {
  id: string;
  deviceId: string;
  deviceName?: string;
  deviceType: string;
  os?: string;
  browser?: string;
  lastIP?: string;
  lastLocation?: {
    country?: string;
    city?: string;
    region?: string;
    lat?: number;
    lng?: number;
  };
  loginCount: number;
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
  sessions?: Session[];
}

export interface Session {
  id: string;
  sessionToken: string;
  expires: string;
  ipAddress?: string;
  userAgent?: string;
  location?: any;
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
}

export function useDeviceManagement() {
  const { data: session } = useSession();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's devices
  const fetchDevices = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/devices");
      const data = await response.json();

      if (data.success) {
        setDevices(data.data.devices);
      } else {
        setError(data.message || "Failed to fetch devices");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  // Logout a specific device
  const logoutDevice = async (deviceId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/auth/devices/${deviceId}/logout`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        // Refresh devices list
        await fetchDevices();
        return { success: true, message: data.message };
      } else {
        setError(data.message || "Failed to logout device");
        return { success: false, message: data.message };
      }
    } catch (err: any) {
      const message = err.message || "Failed to logout device";
      setError(message);
      return { success: false, message };
    }
  };

  // Logout all other devices
  const logoutAllOtherDevices = async () => {
    setError(null);

    try {
      const response = await fetch("/api/auth/devices/logout-all", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        // Refresh devices list
        await fetchDevices();
        return { success: true, message: data.message };
      } else {
        setError(data.message || "Failed to logout other devices");
        return { success: false, message: data.message };
      }
    } catch (err: any) {
      const message = err.message || "Failed to logout other devices";
      setError(message);
      return { success: false, message };
    }
  };

  // Get device activity logs
  const getDeviceLogs = async (deviceId?: string, limit = 10) => {
    try {
      const url = deviceId
        ? `/api/auth/devices/${deviceId}/logs?limit=${limit}`
        : `/api/auth/devices/logs?limit=${limit}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        return data.data.logs;
      } else {
        setError(data.message || "Failed to fetch device logs");
        return [];
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch device logs");
      return [];
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchDevices();
    }
  }, [session?.user?.id]);

  return {
    devices,
    loading,
    error,
    fetchDevices,
    logoutDevice,
    logoutAllOtherDevices,
    getDeviceLogs,
    clearError: () => setError(null),
  };
}
