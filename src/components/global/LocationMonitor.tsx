"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { locationMonitor, useLocationMonitor } from "@/lib/locationMonitor";

export default function LocationMonitor() {
  const { user } = useAuth();
  const monitorStatus = useLocationMonitor();

  useEffect(() => {
    if (user && user.activeRole === "RIDER") {
      console.log("🚀 Starting global location monitoring for rider:", user.id);
      locationMonitor.startMonitoring(user.id, user.activeRole);

      // Request notification permission for GPS warnings
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    } else {
      locationMonitor.stopMonitoring();
    }

    return () => {
      locationMonitor.stopMonitoring();
    };
  }, [user]);

  // Show global warnings if accuracy is poor
  useEffect(() => {
    if (monitorStatus.warnings.length > 0) {
      // Show a global warning banner or toast
      console.warn("⚠️ GPS Accuracy Issues Detected:", monitorStatus.warnings);

      // Dispatch custom event for UI components to show warnings
      window.dispatchEvent(
        new CustomEvent("location-monitor-warning", {
          detail: {
            warnings: monitorStatus.warnings,
            accuracy: monitorStatus.lastAccuracy,
          },
        })
      );
    }
  }, [monitorStatus.warnings]);

  // Show countdown warning before auto-logout
  useEffect(() => {
    const timeUntilLogout = monitorStatus.timeUntilLogout;
    if (timeUntilLogout > 0 && timeUntilLogout < 300) {
      // Last 5 minutes
      const minutes = Math.ceil(timeUntilLogout / 60);
      console.warn(
        `⏰ Auto-logout in ${minutes} minute(s) due to poor GPS accuracy`
      );

      // Dispatch countdown event
      window.dispatchEvent(
        new CustomEvent("location-monitor-countdown", {
          detail: { minutes, seconds: Math.floor(timeUntilLogout) },
        })
      );
    }
  }, [monitorStatus.timeUntilLogout]);

  return null;
}
