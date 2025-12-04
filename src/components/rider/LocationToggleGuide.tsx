"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Smartphone,
  Chrome,
  Settings,
  CheckCircle,
  AlertCircle,
  Globe,
} from "lucide-react";

interface LocationToggleGuideProps {
  onLocationEnabled?: () => void;
  onLocationDisabled?: () => void;
}

export function LocationToggleGuide({
  onLocationEnabled,
  onLocationDisabled,
}: LocationToggleGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  const browserSteps = {
    chrome: [
      "Click the lock icon (🔒) in the address bar",
      "Click 'Site settings'",
      "Find 'Location' and change to 'Allow'",
      "Refresh the page",
    ],
    firefox: [
      "Click the shield icon (🛡️) in the address bar",
      "Click the 'i' icon next to 'Connection secure'",
      "Change Location to 'Allow'",
      "Refresh the page",
    ],
    safari: [
      "Go to Safari > Preferences (⌘,)",
      "Click 'Privacy' tab",
      "Uncheck 'Deny without prompting' for location",
      "Or click 'Manage Website Data' and allow for this site",
    ],
  };

  const detectBrowser = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "chrome";
    if (userAgent.includes("Firefox")) return "firefox";
    if (userAgent.includes("Safari")) return "safari";
    return "chrome"; // default
  };

  const browser = detectBrowser();
  const steps = browserSteps[browser as keyof typeof browserSteps];

  const testLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        }
      );

      if (position.coords.accuracy < 1000) {
        // Less than 1km accuracy
        setIsLocationEnabled(true);
        onLocationEnabled?.();
        return true;
      } else {
        alert(
          `Location accuracy is poor (${Math.round(position.coords.accuracy)}m). Please ensure GPS is enabled.`
        );
        return false;
      }
    } catch (error) {
      alert("Location access failed. Please check your browser settings.");
      return false;
    }
  };

  const BrowserIcon = ({ browser }: { browser: string }) => {
    switch (browser) {
      case "chrome":
        return <Chrome className="h-5 w-5 text-blue-600" />;
      case "firefox":
        return <Globe className="h-5 w-5 text-orange-600" />;
      case "safari":
        return <Globe className="h-5 w-5 text-blue-500" />;
      default:
        return <Chrome className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Setup Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">GPS Status:</span>
          <Badge
            variant={isLocationEnabled ? "default" : "secondary"}
            className={isLocationEnabled ? "bg-green-100 text-green-800" : ""}
          >
            {isLocationEnabled ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Enabled
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 mr-1" />
                Disabled
              </>
            )}
          </Badge>
        </div>

        {/* Browser Detection */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <BrowserIcon browser={browser} />
          <span className="text-sm font-medium capitalize">
            {browser} Browser Detected
          </span>
        </div>

        {/* Step by Step Instructions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Follow these steps:</h4>
          <ol className="space-y-2 text-sm">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <span
                  className={
                    index === currentStep
                      ? "font-medium text-blue-700"
                      : "text-gray-600"
                  }
                >
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Mobile Instructions */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Smartphone className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">On Mobile:</p>
              <p className="text-yellow-700">
                Go to Settings → Apps → [Browser] → Permissions → Location →
                Allow
              </p>
            </div>
          </div>
        </div>

        {/* Enable Location Button */}
        <div className="space-y-2">
          {!isLocationEnabled && (
            <p className="text-xs text-center text-gray-600">
              Click below to request location permission from your browser
            </p>
          )}
          <Button
            onClick={testLocation}
            className="w-full"
            variant={isLocationEnabled ? "outline" : "default"}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isLocationEnabled
              ? "Test Location Again"
              : "Enable Location Access"}
          </Button>
        </div>

        {/* Additional Help */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Make sure GPS is enabled on your device</p>
          <p>• Allow location access when prompted</p>
          <p>• Try refreshing the page after enabling</p>
          <p>• If issues persist, try a different browser</p>
        </div>
      </CardContent>
    </Card>
  );
}
