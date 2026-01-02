"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { locationService } from "@/services/location.service";
import { useLocationMonitor } from "@/lib/locationMonitor";
import {
  MapPin,
  AlertCircle,
  CheckCircle,
  Navigation,
  Clock,
} from "lucide-react";

export default function LocationPermissionBanner() {
  const [permissionStatus, setPermissionStatus] = useState<{
    granted: boolean;
    denied: boolean;
    prompt: boolean;
    unavailable: boolean;
  } | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const monitorStatus = useLocationMonitor();

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await locationService.checkPermission();
      setPermissionStatus(status);
    } catch (error) {
      console.error("Failed to check location permission:", error);
    }
  };

  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      const status = await locationService.requestPermission();
      setPermissionStatus(status);

      if (status.granted) {
        // Try to get initial location
        try {
          await locationService.requestLocation({
            enableHighAccuracy: true,
            timeout: 10000,
            maxAccuracy: 100,
          });
        } catch (error) {
          console.warn("Initial location request failed:", error);
        }
      }
    } catch (error) {
      console.error("Permission request failed:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  // Don't show banner if permission is granted and accuracy is good
  if (permissionStatus?.granted && monitorStatus.lastAccuracy <= 100) {
    return null;
  }

  // Don't show banner if user is not a rider (handled by parent component)
  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {permissionStatus?.granted ? (
            <Navigation className="h-5 w-5 text-orange-400" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-400" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-orange-800">
              {permissionStatus?.granted
                ? "GPS Accuracy Low"
                : "Location Access Required"}
            </p>
            <div className="flex items-center gap-2">
              {monitorStatus.lastAccuracy > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-100 text-orange-800 border-orange-300"
                >
                  {Math.round(monitorStatus.lastAccuracy)}m accuracy
                </Badge>
              )}
              {monitorStatus.timeUntilLogout > 0 &&
                monitorStatus.timeUntilLogout < 300 && (
                  <Badge
                    variant="destructive"
                    className="text-xs animate-pulse"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {Math.ceil(monitorStatus.timeUntilLogout / 60)}min
                  </Badge>
                )}
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm text-orange-700">
              {permissionStatus?.granted
                ? "Your GPS accuracy is low. Move to an open area for better location tracking."
                : "Enable location access for accurate delivery tracking and rider assignments."}
            </p>

            {!permissionStatus?.granted && !permissionStatus?.denied && (
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={requestPermission}
                  disabled={isRequesting}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {isRequesting ? "Requesting..." : "Enable Location"}
                </Button>
              </div>
            )}

            {permissionStatus?.denied && (
              <div className="mt-3">
                <p className="text-xs text-orange-600">
                  Location access denied. Please enable it in your browser
                  settings and refresh the page.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
