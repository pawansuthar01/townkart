"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  MapPin,
  RefreshCw,
  Clock,
  Battery,
  Wifi,
  WifiOff,
  Shield,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { resilientLocationService } from "@/services/resilient-location.service";
import {
  LocationData,
  RiderLocationTrackingOptions,
} from "@/services/location.service";

/* ---------------- TYPES ---------------- */

interface LocationStatus {
  hasPermission: boolean;
  isEnabled: boolean;
  accuracy: number | null;
  lastUpdate: Date | null;
  error: string | null;
  batteryLevel: number;
  isOnline: boolean;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPermissionEnforcerProps {
  onLocationUpdate?: (location: LocationData) => void;
  requireContinuousTracking?: boolean;
  onPermissionDenied?: () => void;
  onLocationLost?: () => void;
  className?: string;
  showPrecisionToggle?: boolean;
  showInteractionToggle?: boolean;
  onPrecisionChange?: (enabled: boolean) => void;
  onInteractionChange?: (enabled: boolean) => void;
}

/* ---------------- COMPONENT ---------------- */

export function LocationPermissionEnforcer({
  onLocationUpdate,
  requireContinuousTracking = true,
  onPermissionDenied,
  onLocationLost,
  className = "",
  showPrecisionToggle = true,
  showInteractionToggle = true,
  onPrecisionChange,
  onInteractionChange,
}: LocationPermissionEnforcerProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [locationStatus, setLocationStatus] = useState<LocationStatus>({
    hasPermission: false,
    isEnabled: false,
    accuracy: null,
    lastUpdate: null,
    error: null,
    batteryLevel: 100,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    latitude: null,
    longitude: null,
  });

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showLocationLostDialog, setShowLocationLostDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [highPrecisionEnabled, setHighPrecisionEnabled] = useState(true);
  const [interactionEnabled, setInteractionEnabled] = useState(true);

  /* ---------------- REFS (CRITICAL) ---------------- */

  const trackingStartedRef = useRef(false);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const permissionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const lastLocationTimeRef = useRef<number>(0);

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    checkLocationPermission();
    setupBatteryMonitoring();
    setupResilientService();

    permissionIntervalRef.current = setInterval(checkLocationPermission, 30000);

    const online = () => setLocationStatus((s) => ({ ...s, isOnline: true }));
    const offline = () => setLocationStatus((s) => ({ ...s, isOnline: false }));

    window.addEventListener("online", online);
    window.addEventListener("offline", offline);

    return () => {
      permissionIntervalRef.current &&
        clearInterval(permissionIntervalRef.current);

      permissionStatusRef.current?.removeEventListener(
        "change",
        checkLocationPermission
      );

      logoutTimerRef.current && clearTimeout(logoutTimerRef.current);

      resilientLocationService.stopResilientTracking();

      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  /* ---------------- PERMISSION ---------------- */

  const checkLocationPermission = async () => {
    if (isCheckingPermission) return;
    setIsCheckingPermission(true);

    try {
      if (!navigator.permissions) {
        requestLocationPermission();
        return;
      }

      const permission = await navigator.permissions.query({
        name: "geolocation",
      });

      permissionStatusRef.current = permission;
      permission.addEventListener("change", checkLocationPermission);

      if (permission.state === "granted") {
        setLocationStatus((s) => ({ ...s, hasPermission: true }));
        startTrackingOnce();
      }

      if (permission.state === "denied") {
        handlePermissionDenied();
      }
    } catch {
      setLocationStatus((s) => ({
        ...s,
        error: "Unable to check location permissions",
      }));
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );
      startTrackingOnce();
    } catch {
      handlePermissionDenied();
    }
  };

  const handlePermissionDenied = () => {
    setShowPermissionDialog(true);
    onPermissionDenied?.();
  };

  /* ---------------- TRACKING ---------------- */

  const startTrackingOnce = async () => {
    if (trackingStartedRef.current) return;
    trackingStartedRef.current = true;

    const options: RiderLocationTrackingOptions = {
      updateInterval: requireContinuousTracking ? 10000 : 30000,
      backgroundEnabled: true,
      batteryOptimizationWarning: true,
      spoofingDetection: true,
    };

    await resilientLocationService.startResilientTracking(
      options,
      (location) => {
        lastLocationTimeRef.current = Date.now();

        setLocationStatus((s) => ({
          ...s,
          isEnabled: true,
          accuracy: location.accuracy,
          lastUpdate: new Date(),
          latitude: location.latitude,
          longitude: location.longitude,
          error: null,
        }));

        onLocationUpdate?.(location);
        setShowLocationLostDialog(false);
      },
      () => handleLocationLost()
    );

    // watchdog (only once)
    if (requireContinuousTracking) {
      setInterval(() => {
        if (Date.now() - lastLocationTimeRef.current > 60000) {
          handleLocationLost();
        }
      }, 30000);
    }
  };

  const handleLocationLost = () => {
    setShowLocationLostDialog(true);
    onLocationLost?.();

    if (requireContinuousTracking && !logoutTimerRef.current) {
      logoutTimerRef.current = setTimeout(
        async () => {
          await logout();
          router.push("/auth/login?reason=gps_required");
        },
        10 * 60 * 1000
      );
    }
  };

  /* ---------------- SETUP ---------------- */

  const setupBatteryMonitoring = () => {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((b: any) => {
        setLocationStatus((s) => ({
          ...s,
          batteryLevel: Math.round(b.level * 100),
        }));
        b.onlevelchange = () =>
          setLocationStatus((s) => ({
            ...s,
            batteryLevel: Math.round(b.level * 100),
          }));
      });
    }
  };

  const setupResilientService = () => {
    resilientLocationService.configure({
      maxRetries: 5,
      initialBackoffDelay: 1000,
      maxBackoffDelay: 30000,
      offlineQueueSize: 100,
      syncInterval: 30000,
      enableBackgroundSync: true,
    });
  };

  /* ---------------- HELPERS ---------------- */

  const showCoords =
    locationStatus.latitude !== null && locationStatus.longitude !== null;

  const getAccuracyColor = (a: number | null) =>
    !a
      ? "text-gray-500"
      : a <= 10
        ? "text-green-600"
        : a <= 50
          ? "text-yellow-600"
          : "text-red-600";

  const getBatteryColor = (b: number) =>
    b >= 50 ? "text-green-600" : b >= 20 ? "text-yellow-600" : "text-red-600";

  const handlePrecisionToggle = (enabled: boolean) => {
    setHighPrecisionEnabled(enabled);
    onPrecisionChange?.(enabled);

    // Reconfigure location tracking with new precision setting
    if (enabled) {
      resilientLocationService.configure({
        maxRetries: 5,
        initialBackoffDelay: 1000,
        maxBackoffDelay: 30000,
        offlineQueueSize: 100,
        syncInterval: 30000,
        enableBackgroundSync: true,
      });
    } else {
      resilientLocationService.configure({
        maxRetries: 3,
        initialBackoffDelay: 2000,
        maxBackoffDelay: 60000,
        offlineQueueSize: 50,
        syncInterval: 60000,
        enableBackgroundSync: false,
      });
    }
  };

  const handleInteractionToggle = (enabled: boolean) => {
    setInteractionEnabled(enabled);
    onInteractionChange?.(enabled);
  };

  return (
    <>
      {/* Permission Required Dialog */}
      {showPermissionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Shield className="h-5 w-5" />
                Location Access Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Location access is mandatory for delivery riders. This allows
                  us to:
                  <ul className="mt-2 ml-4 list-disc text-sm">
                    <li>Assign you to nearby delivery requests</li>
                    <li>Track your location during deliveries</li>
                    <li>Ensure customer safety and order accuracy</li>
                    <li>Calculate accurate delivery times</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={requestLocationPermission} className="flex-1">
                  Enable Location Access
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPermissionDialog(false)}
                  className="flex-1"
                >
                  Try Again Later
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Without location access, you cannot go online or accept
                deliveries.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location Lost Dialog */}
      {showLocationLostDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                GPS Signal Lost
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your GPS signal has been lost. This may affect delivery
                  assignments and tracking.
                  {requireContinuousTracking &&
                    " Active deliveries require continuous GPS tracking."}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Network Status</p>
                  <div className="flex items-center gap-1">
                    {locationStatus.isOnline ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <span>
                      {locationStatus.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600">Battery Level</p>
                  <span
                    className={getBatteryColor(locationStatus.batteryLevel)}
                  >
                    {locationStatus.batteryLevel}%
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowLocationLostDialog(false);
                    requestLocationPermission();
                  }}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry GPS
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowLocationLostDialog(false)}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>

              {requireContinuousTracking && (
                <p className="text-xs text-red-600 text-center">
                  ⚠️ GPS required for active delivery. System will auto-logout
                  in 10 minutes if unresolved.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Dialog */}
      {showSettingsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Location Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {showPrecisionToggle && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="precision-toggle"
                      className="text-sm font-medium"
                    >
                      High Precision GPS
                    </Label>
                    <p className="text-xs text-gray-600">
                      More accurate location tracking (uses more battery)
                    </p>
                  </div>
                  <Switch
                    id="precision-toggle"
                    checked={highPrecisionEnabled}
                    onCheckedChange={handlePrecisionToggle}
                  />
                </div>
              )}

              {showInteractionToggle && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="interaction-toggle"
                      className="text-sm font-medium"
                    >
                      Interactive Mode
                    </Label>
                    <p className="text-xs text-gray-600">
                      Allow location-based interactions and alerts
                    </p>
                  </div>
                  <Switch
                    id="interaction-toggle"
                    checked={interactionEnabled}
                    onCheckedChange={handleInteractionToggle}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setShowSettingsDialog(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Status Indicator */}
      <div className={`p-3 rounded-lg border ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                locationStatus.hasPermission && locationStatus.isEnabled
                  ? "bg-green-500 animate-pulse"
                  : locationStatus.hasPermission
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
            />

            <div>
              <p className="text-sm font-medium">
                {locationStatus.hasPermission && locationStatus.isEnabled
                  ? "GPS Active"
                  : locationStatus.hasPermission
                    ? "GPS Available"
                    : "GPS Required"}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                {locationStatus.latitude && locationStatus.longitude && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {locationStatus.latitude.toFixed(6)},{" "}
                    {locationStatus.longitude.toFixed(6)}
                  </span>
                )}
                {locationStatus.accuracy && (
                  <span className={getAccuracyColor(locationStatus.accuracy)}>
                    ±{Math.round(locationStatus.accuracy)}m
                  </span>
                )}
                {locationStatus.lastUpdate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(locationStatus.lastUpdate).toLocaleTimeString()}
                  </span>
                )}
                <span className={getBatteryColor(locationStatus.batteryLevel)}>
                  <Battery className="h-3 w-3 inline mr-1" />
                  {locationStatus.batteryLevel}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(showPrecisionToggle || showInteractionToggle) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsDialog(true)}
                className="p-1 h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {isCheckingPermission && (
              <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
        </div>

        {locationStatus.error && (
          <Alert className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {locationStatus.error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
}
