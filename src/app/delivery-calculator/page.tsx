"use client";

import { useState } from "react";
import { DeliveryChargeCalculator } from "@/components/delivery/DeliveryChargeCalculator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, MapPin, Clock, DollarSign, Info } from "lucide-react";

export default function DeliveryCalculatorPage() {
  const [calculatedCharge, setCalculatedCharge] = useState<number | null>(null);
  const [chargeBreakdown, setChargeBreakdown] = useState<string[]>([]);

  const handleChargeCalculated = (charge: number, breakdown: string[]) => {
    setCalculatedCharge(charge);
    setChargeBreakdown(breakdown);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-16">
        <div className="w-full px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Calculator className="h-16 w-16 mr-4" />
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">
                  Delivery Charge Calculator
                </h1>
                <p className="text-xl text-blue-100">
                  Calculate accurate delivery charges for your orders
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calculator */}
            <div className="lg:col-span-2">
              <DeliveryChargeCalculator
                onChargeCalculated={handleChargeCalculated}
                showDetails={true}
              />
            </div>

            {/* Information Panel */}
            <div className="space-y-6">
              {/* Quick Result */}
              {calculatedCharge !== null && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-800">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Calculated Charge
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-4">
                      ₹{calculatedCharge}
                    </div>
                    <div className="space-y-2">
                      {chargeBreakdown.slice(0, 3).map((item, index) => (
                        <div key={index} className="text-sm text-green-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delivery Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Distance Based
                      </h4>
                      <p className="text-sm text-gray-600">
                        Charges calculated based on distance between merchant
                        and delivery location.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Time Based</h4>
                      <p className="text-sm text-gray-600">
                        Peak hours (12-2 PM) and night hours (10 PM-6 AM) may
                        have additional charges.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Free Delivery
                      </h4>
                      <p className="text-sm text-gray-600">
                        Orders above ₹500 qualify for free delivery.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Tiers */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Tiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Regular</div>
                      <div className="text-sm text-gray-600">
                        Standard pricing
                      </div>
                    </div>
                    <Badge variant="outline">No discount</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">Premium</div>
                      <div className="text-sm text-gray-600">
                        Loyal customers
                      </div>
                    </div>
                    <Badge className="bg-blue-500">₹10 off</Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">VIP</div>
                      <div className="text-sm text-gray-600">
                        Elite customers
                      </div>
                    </div>
                    <Badge className="bg-purple-500">₹20 off</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Zone-based Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Zone-based Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Metro Cities</span>
                      <span className="font-medium">₹40 base</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>City Centers</span>
                      <span className="font-medium">₹35 base</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Suburban</span>
                      <span className="font-medium">₹30 base</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Rural Areas</span>
                      <span className="font-medium">₹25 base</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>How Delivery Charges are Calculated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Base Components
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Base delivery fee (₹25-40 depending on zone)</li>
                      <li>• Distance-based charges (₹7-10 per km)</li>
                      <li>• First 2km included in base fee</li>
                      <li>• Minimum charge guarantee</li>
                      <li>• Maximum charge cap</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Dynamic Factors
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Peak hour surcharge (12-2 PM)</li>
                      <li>• Night hour surcharge (10 PM-6 AM)</li>
                      <li>• Surge pricing during high demand</li>
                      <li>• Customer tier discounts</li>
                      <li>• Free delivery thresholds</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Transparent Pricing</p>
                      <p>
                        All delivery charges are calculated transparently with
                        no hidden fees. Use this calculator to understand
                        exactly what you're paying for.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
