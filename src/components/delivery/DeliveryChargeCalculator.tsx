"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  MapPin,
  Clock,
  DollarSign,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  calculateOrderDeliveryCharge,
  DeliveryChargeConfig,
  DEFAULT_DELIVERY_CONFIG,
} from "@/lib/deliveryCharges";
import { estimateDeliveryTime } from "@/lib/deliveryTracking";

interface DeliveryChargeCalculatorProps {
  orderValue?: number;
  distanceKm?: number;
  customerTier?: "regular" | "premium" | "vip";
  merchantLocation?: { lat: number; lng: number };
  customerLocation?: { lat: number; lng: number };
  onChargeCalculated?: (charge: number, breakdown: string[]) => void;
  showDetails?: boolean;
}

export function DeliveryChargeCalculator({
  orderValue: initialOrderValue = 0,
  distanceKm: initialDistance = 5,
  customerTier = "regular",
  merchantLocation,
  customerLocation,
  onChargeCalculated,
  showDetails = true,
}: DeliveryChargeCalculatorProps) {
  const [orderValue, setOrderValue] = useState(initialOrderValue);
  const [distanceKm, setDistanceKm] = useState(initialDistance);
  const [selectedTier, setSelectedTier] = useState(customerTier);
  const [calculation, setCalculation] = useState<any>(null);
  const [timeEstimate, setTimeEstimate] = useState<any>(null);

  // Calculate delivery charge whenever inputs change
  useEffect(() => {
    if (orderValue > 0 && distanceKm > 0) {
      const result = calculateOrderDeliveryCharge(
        orderValue,
        distanceKm,
        selectedTier,
        merchantLocation,
        customerLocation
      );

      const timeResult = estimateDeliveryTime(distanceKm);

      setCalculation(result);
      setTimeEstimate(timeResult);

      if (onChargeCalculated) {
        onChargeCalculated(
          result.totalCharge,
          result.breakdown.map((item) => `${item.label}: ₹${item.amount}`)
        );
      }
    }
  }, [
    orderValue,
    distanceKm,
    selectedTier,
    merchantLocation,
    customerLocation,
    onChargeCalculated,
  ]);

  const handleCalculate = () => {
    if (orderValue > 0 && distanceKm > 0) {
      const result = calculateOrderDeliveryCharge(
        orderValue,
        distanceKm,
        selectedTier,
        merchantLocation,
        customerLocation
      );

      const timeResult = estimateDeliveryTime(distanceKm);

      setCalculation(result);
      setTimeEstimate(timeResult);

      if (onChargeCalculated) {
        onChargeCalculated(
          result.totalCharge,
          result.breakdown.map((item) => `${item.label}: ₹${item.amount}`)
        );
      }
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "premium":
        return "bg-blue-500";
      case "vip":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTierDiscount = (tier: string) => {
    switch (tier) {
      case "premium":
        return "₹10 off";
      case "vip":
        return "₹20 off";
      default:
        return "No discount";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Delivery Charge Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderValue">Order Value (₹)</Label>
            <Input
              id="orderValue"
              type="number"
              value={orderValue}
              onChange={(e) => setOrderValue(Number(e.target.value))}
              placeholder="Enter order amount"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="distance">Distance (km)</Label>
            <Input
              id="distance"
              type="number"
              value={distanceKm}
              onChange={(e) => setDistanceKm(Number(e.target.value))}
              placeholder="Enter distance"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        {/* Customer Tier Selection */}
        <div className="space-y-2">
          <Label>Customer Tier</Label>
          <div className="flex space-x-2">
            {(["regular", "premium", "vip"] as const).map((tier) => (
              <Button
                key={tier}
                variant={selectedTier === tier ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTier(tier)}
                className="capitalize"
              >
                {tier}
                {tier !== "regular" && (
                  <Badge
                    className={`ml-2 ${getTierColor(tier)} text-white text-xs`}
                  >
                    {getTierDiscount(tier)}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Calculate Button */}
        <Button onClick={handleCalculate} className="w-full">
          Calculate Delivery Charge
        </Button>

        {/* Results */}
        {calculation && (
          <div className="space-y-4">
            <Separator />

            {/* Main Result */}
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ₹{calculation.totalCharge}
              </div>
              <div className="text-sm text-green-700">
                Estimated Delivery Charge
              </div>
              {timeEstimate && (
                <div className="flex items-center justify-center mt-2 text-sm text-green-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {timeEstimate.timeRange}
                </div>
              )}
            </div>

            {showDetails && (
              <>
                {/* Charge Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">
                    Charge Breakdown
                  </h4>
                  <div className="space-y-2">
                    {calculation.breakdown.map(
                      (item: string, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {item.split(":")[0]}
                          </span>
                          <span className="font-medium">
                            {item.split(":")[1]}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <Separator />

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span>
                      Free delivery on orders above ₹
                      {DEFAULT_DELIVERY_CONFIG.freeDeliveryThreshold}
                    </span>
                  </div>

                  {calculation.freeDeliveryDiscount > 0 && (
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">
                        Free delivery applied!
                      </span>
                    </div>
                  )}

                  {calculation.timeMultiplier > 1 && (
                    <div className="flex items-center space-x-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-orange-600">
                        Peak hour surcharge applied
                      </span>
                    </div>
                  )}

                  {selectedTier !== "regular" && (
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">
                        {selectedTier.toUpperCase()} discount applied
                      </span>
                    </div>
                  )}
                </div>

                {/* Delivery Time Estimate */}
                {timeEstimate && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        Delivery Time Estimate
                      </span>
                    </div>
                    <div className="text-sm text-blue-700">
                      <div className="font-medium">
                        {timeEstimate.timeRange}
                      </div>
                      <div className="text-xs mt-1">
                        Based on {distanceKm}km distance and current traffic
                        conditions
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Delivery charges include base fee + distance-based charges</p>
          <p>
            • Peak hours (12-2 PM) and night hours (10 PM-6 AM) may have
            additional charges
          </p>
          <p>• Premium and VIP customers get special discounts</p>
          <p>• Free delivery available on orders above ₹500</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick delivery charge display component
export function DeliveryChargeDisplay({
  charge,
  breakdown,
  showBreakdown = false,
}: {
  charge: number;
  breakdown?: string[];
  showBreakdown?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Delivery Charge</span>
        <span className="font-semibold">₹{charge}</span>
      </div>

      {showBreakdown && breakdown && breakdown.length > 0 && (
        <div className="text-xs text-gray-500 space-y-1">
          {breakdown.slice(0, 2).map((item, index) => (
            <div key={index}>{item}</div>
          ))}
          {breakdown.length > 2 && (
            <div className="text-blue-600 cursor-pointer hover:underline">
              +{breakdown.length - 2} more details
            </div>
          )}
        </div>
      )}
    </div>
  );
}
