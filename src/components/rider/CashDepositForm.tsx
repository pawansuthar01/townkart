"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Camera,
  CheckCircle,
  AlertTriangle,
  Building2,
  DollarSign,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number; // in meters
}

interface CashDepositFormProps {
  outstandingAmount: number;
  stores: Store[];
  onDepositSubmit: (data: {
    storeId: string;
    amount: number;
    location: { latitude: number; longitude: number; accuracy: number };
    notes?: string;
    photoProofUrl?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function CashDepositForm({
  outstandingAmount,
  stores,
  onDepositSubmit,
  isLoading = false,
  className,
}: CashDepositFormProps) {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [amount, setAmount] = useState(outstandingAmount.toString());
  const [notes, setNotes] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "checking" | "valid" | "invalid"
  >("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort stores by distance
  const sortedStores = React.useMemo(() => {
    if (!currentLocation) return stores;

    return stores
      .map((store) => ({
        ...store,
        distance: calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          store.latitude,
          store.longitude,
        ),
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [stores, currentLocation]);

  // Get current location on mount
  useEffect(() => {
    checkLocation();
  }, []);

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
      setLocationStatus("valid");
    } catch (error) {
      console.error("Location error:", error);
      setLocationStatus("invalid");
    }
  };

  const validateDeposit = () => {
    const depositAmount = parseFloat(amount);

    if (!selectedStore) {
      throw new Error("Please select a store");
    }

    if (!depositAmount || depositAmount <= 0) {
      throw new Error("Please enter a valid amount");
    }

    if (depositAmount > outstandingAmount) {
      throw new Error("Cannot deposit more than outstanding amount");
    }

    if (!currentLocation || locationStatus !== "valid") {
      throw new Error("Location verification required");
    }

    // Check if rider is within 500m of selected store
    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      selectedStore.latitude,
      selectedStore.longitude,
    );

    if (distance > 500) {
      throw new Error("You must be within 500m of the selected store");
    }
  };

  const handleSubmit = async () => {
    try {
      validateDeposit();

      setIsSubmitting(true);

      await onDepositSubmit({
        storeId: selectedStore!.id,
        amount: parseFloat(amount),
        location: currentLocation!,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setAmount(outstandingAmount.toString());
      setNotes("");
      setSelectedStore(null);
    } catch (error) {
      console.error("Deposit submission error:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Cash Deposit
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Outstanding Amount Display */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            ₹{outstandingAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-sm text-blue-700">Outstanding Cash</div>
        </div>

        {/* Location Status */}
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
          >
            {locationStatus === "valid" && "✓ Verified"}
            {locationStatus === "checking" && "Checking..."}
            {locationStatus === "invalid" && "✗ Required"}
          </Badge>
        </div>

        {/* Store Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Store</Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sortedStores.map((store) => (
              <div
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-colors",
                  selectedStore?.id === store.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{store.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {store.address}
                    </div>
                  </div>
                  {store.distance && (
                    <Badge variant="outline" className="text-xs">
                      {formatDistance(store.distance)}
                    </Badge>
                  )}
                </div>
                {selectedStore?.id === store.id && (
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Deposit Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-sm font-medium">
            Deposit Amount (₹)
          </Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            max={outstandingAmount}
            className="text-lg"
          />
          {parseFloat(amount) > outstandingAmount && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 text-sm">
                Cannot deposit more than outstanding amount
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
            rows={2}
          />
        </div>

        {/* Validation Warnings */}
        {selectedStore && currentLocation && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800">
                  Distance Check
                </div>
                <div className="text-yellow-700 mt-1">
                  You are{" "}
                  {formatDistance(
                    calculateDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      selectedStore.latitude,
                      selectedStore.longitude,
                    ),
                  )}{" "}
                  from {selectedStore.name}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={
            isLoading ||
            isSubmitting ||
            !selectedStore ||
            !amount ||
            locationStatus !== "valid" ||
            parseFloat(amount) > outstandingAmount
          }
          className="w-full h-12 bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Deposit...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Deposit Cash
            </div>
          )}
        </Button>

        {/* Helper Text */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Ensure you're at the store location. Deposits are verified by store
            staff.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function to calculate distance
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Distance in meters
}
