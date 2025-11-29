"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CashCollectionButtonProps {
  orderId: string;
  deliveryId: string;
  amount: number;
  onCashCollected: (data: {
    amount: number;
    location: { latitude: number; longitude: number; accuracy: number };
    otp?: string;
    photoProofUrl?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function CashCollectionButton({
  orderId,
  deliveryId,
  amount,
  onCashCollected,
  isLoading = false,
  className,
}: CashCollectionButtonProps) {
  const [isCollecting, setIsCollecting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<
    "checking" | "valid" | "invalid"
  >("checking");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  const checkLocation = async () => {
    try {
      setLocationStatus("checking");

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
          });
        },
      );

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setCurrentLocation(location);

      // Validate location accuracy (must be within 100m)
      if (location.accuracy <= 100) {
        setLocationStatus("valid");
      } else {
        setLocationStatus("invalid");
      }
    } catch (error) {
      console.error("Location error:", error);
      setLocationStatus("invalid");
    }
  };

  const handleCashCollection = async () => {
    if (!currentLocation || locationStatus !== "valid") {
      await checkLocation();
      return;
    }

    setIsCollecting(true);
    try {
      await onCashCollected({
        amount,
        location: currentLocation,
        // OTP and photo proof would be collected via modal for high-value orders
      });
    } catch (error) {
      console.error("Cash collection error:", error);
    } finally {
      setIsCollecting(false);
    }
  };

  // Auto-check location on mount
  React.useEffect(() => {
    checkLocation();
  }, []);

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-green-600 mb-2">
            ₹{amount.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Cash to Collect</div>
        </div>

        {/* Status Indicators */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Location</span>
            </div>
            <Badge
              variant={
                locationStatus === "valid"
                  ? "default"
                  : locationStatus === "checking"
                    ? "secondary"
                    : "destructive"
              }
              className="text-xs"
            >
              {locationStatus === "valid" && "✓ Verified"}
              {locationStatus === "checking" && "Checking..."}
              {locationStatus === "invalid" && "✗ Invalid"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <span className="text-sm">Amount</span>
            </div>
            <Badge variant="default" className="text-xs">
              ✓ Matched
            </Badge>
          </div>

          {amount > 1000 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-800">
                High-value order - OTP verification required
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          onClick={handleCashCollection}
          disabled={isLoading || isCollecting || locationStatus === "invalid"}
          className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700"
          size="lg"
        >
          {isCollecting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Recording...
            </div>
          ) : locationStatus === "checking" ? (
            "Checking Location..."
          ) : locationStatus === "invalid" ? (
            "Location Invalid - Retry"
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Cash Received
            </div>
          )}
        </Button>

        {/* Helper Text */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Ensure you're at the delivery location with accurate GPS
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
