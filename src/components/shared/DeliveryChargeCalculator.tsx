"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Calculator,
  Truck,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  calculateDeliveryCharge,
  DeliveryChargeResult,
  DeliveryCalculationInput,
} from "@/lib/deliveryCharges";

interface DeliveryChargeCalculatorProps {
  pickupLocation?: { latitude: number; longitude: number; address?: string };
  deliveryLocation?: { latitude: number; longitude: number; address?: string };
  orderValue?: number;
  onChargeCalculated?: (result: DeliveryChargeResult) => void;
  className?: string;
}

export function DeliveryChargeCalculator({
  pickupLocation,
  deliveryLocation,
  orderValue = 0,
  onChargeCalculated,
  className = "",
}: DeliveryChargeCalculatorProps) {
  const [input, setInput] = useState<DeliveryCalculationInput>({
    pickupLocation: pickupLocation || { latitude: 12.9716, longitude: 77.5946 },
    deliveryLocation: deliveryLocation || {
      latitude: 12.9816,
      longitude: 77.6046,
    },
    orderValue: orderValue,
    weight: 1,
    priority: "standard",
  });

  const [result, setResult] = useState<DeliveryChargeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate when inputs change
  useEffect(() => {
    if (
      input.pickupLocation &&
      input.deliveryLocation &&
      input.orderValue > 0
    ) {
      calculateCharges();
    }
  }, [input]);

  const calculateCharges = async () => {
    try {
      setLoading(true);
      setError(null);

      const calculationResult = calculateDeliveryCharge(input);
      setResult(calculationResult);
      onChargeCalculated?.(calculationResult);
    } catch (err: any) {
      setError(err.message || "Failed to calculate delivery charges");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof DeliveryCalculationInput,
    value: any,
  ) => {
    setInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationChange = (
    type: "pickup" | "delivery",
    field: "latitude" | "longitude",
    value: number,
  ) => {
    setInput((prev) => ({
      ...prev,
      [type === "pickup" ? "pickupLocation" : "deliveryLocation"]: {
        ...prev[type === "pickup" ? "pickupLocation" : "deliveryLocation"],
        [field]: value,
      },
    }));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Delivery Charge Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pickup Location */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Pickup Location
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="pickup-lat" className="text-xs">
                  Latitude
                </Label>
                <Input
                  id="pickup-lat"
                  type="number"
                  step="0.000001"
                  value={input.pickupLocation.latitude}
                  onChange={(e) =>
                    handleLocationChange(
                      "pickup",
                      "latitude",
                      parseFloat(e.target.value),
                    )
                  }
                  placeholder="12.9716"
                />
              </div>
              <div>
                <Label htmlFor="pickup-lng" className="text-xs">
                  Longitude
                </Label>
                <Input
                  id="pickup-lng"
                  type="number"
                  step="0.000001"
                  value={input.pickupLocation.longitude}
                  onChange={(e) =>
                    handleLocationChange(
                      "pickup",
                      "longitude",
                      parseFloat(e.target.value),
                    )
                  }
                  placeholder="77.5946"
                />
              </div>
            </div>
          </div>

          {/* Delivery Location */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Delivery Location
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="delivery-lat" className="text-xs">
                  Latitude
                </Label>
                <Input
                  id="delivery-lat"
                  type="number"
                  step="0.000001"
                  value={input.deliveryLocation.latitude}
                  onChange={(e) =>
                    handleLocationChange(
                      "delivery",
                      "latitude",
                      parseFloat(e.target.value),
                    )
                  }
                  placeholder="12.9816"
                />
              </div>
              <div>
                <Label htmlFor="delivery-lng" className="text-xs">
                  Longitude
                </Label>
                <Input
                  id="delivery-lng"
                  type="number"
                  step="0.000001"
                  value={input.deliveryLocation.longitude}
                  onChange={(e) =>
                    handleLocationChange(
                      "delivery",
                      "longitude",
                      parseFloat(e.target.value),
                    )
                  }
                  placeholder="77.6046"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="order-value">Order Value (₹)</Label>
            <Input
              id="order-value"
              type="number"
              value={input.orderValue}
              onChange={(e) =>
                handleInputChange("orderValue", parseFloat(e.target.value) || 0)
              }
              placeholder="500"
            />
          </div>

          <div>
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={input.weight || 1}
              onChange={(e) =>
                handleInputChange("weight", parseFloat(e.target.value) || 1)
              }
              placeholder="1.0"
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={input.priority}
              onValueChange={(value: "standard" | "express" | "same_day") =>
                handleInputChange("priority", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="express">Express (+50%)</SelectItem>
                <SelectItem value="same_day">Same Day (+100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Calculate Button */}
        <Button
          onClick={calculateCharges}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Calculating...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Delivery Charge
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <Separator />

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <Truck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-600">Distance</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {result.estimatedDistance.toFixed(1)} km
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-600">ETA</p>
                  <p className="text-2xl font-bold text-green-900">
                    {Math.ceil(result.estimatedTime)} min
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-purple-600">Total Charge</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ₹{result.totalCharge}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Zone Information */}
            {result.zone && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {result.zone.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Estimated delivery: {result.zone.estimatedDeliveryTime}{" "}
                        minutes
                      </p>
                    </div>
                    <Badge className="bg-green-500 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Zone Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Charge Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Charge Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.breakdown.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      {item.description && (
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <p
                      className={`font-semibold ${item.amount < 0 ? "text-green-600" : "text-gray-900"}`}
                    >
                      {item.amount < 0 ? "-" : ""}₹{Math.abs(item.amount)}
                    </p>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between py-2">
                  <p className="text-lg font-bold text-gray-900">Total</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{result.totalCharge}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Applied Discounts */}
            {result.appliedDiscounts.length > 0 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-800">
                    Applied Discounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.appliedDiscounts.map((discount, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-800">
                          {discount.description}
                        </span>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        -₹{discount.amount}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for using delivery charge calculation
export function useDeliveryChargeCalculation() {
  const [result, setResult] = useState<DeliveryChargeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = async (input: DeliveryCalculationInput) => {
    try {
      setLoading(true);
      setError(null);

      const calculationResult = calculateDeliveryCharge(input);
      setResult(calculationResult);

      return calculationResult;
    } catch (err: any) {
      const errorMessage =
        err.message || "Failed to calculate delivery charges";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    result,
    loading,
    error,
    calculate,
  };
}
