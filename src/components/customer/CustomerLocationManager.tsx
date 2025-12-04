"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Search,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  timestamp: string;
}

interface CustomerLocationManagerProps {
  onLocationSelect?: (location: LocationData) => void;
  onAddressSelect?: (address: any) => void;
  required?: boolean;
  className?: string;
}

export function CustomerLocationManager({
  onLocationSelect,
  onAddressSelect,
  required = false,
  className = "",
}: CustomerLocationManagerProps) {
  const { user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualAddressMode, setManualAddressMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const watchIdRef = useRef<number | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved addresses on mount
  useEffect(() => {
    if (user?.id) {
      loadSavedAddresses();
    }
  }, [user?.id]);

  const loadSavedAddresses = async () => {
    try {
      const response = await fetch("/api/user/addresses");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedAddresses(data.addresses);
        }
      }
    } catch (error) {
      console.error("Error loading saved addresses:", error);
    }
  };

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000, // Accept cached location up to 1 minute old
          });
        }
      );

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString(),
      };

      // Reverse geocode to get address
      const address = await reverseGeocode(
        locationData.latitude,
        locationData.longitude
      );
      locationData.address = address;

      setCurrentLocation(locationData);
      setManualAddressMode(false);
      onLocationSelect?.(locationData);

      // Log location consent and usage
      await logLocationUsage(locationData, "auto_detect");
    } catch (error: any) {
      console.error("Error detecting location:", error);

      let errorMessage = "Unable to detect your location";
      if (error.code === error.PERMISSION_DENIED) {
        errorMessage =
          "Location access denied. Please enable location permissions or enter address manually.";
        setManualAddressMode(true);
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage =
          "Location information is unavailable. Please enter your address manually.";
        setManualAddressMode(true);
      } else if (error.code === error.TIMEOUT) {
        errorMessage =
          "Location detection timed out. Please try again or enter address manually.";
        setManualAddressMode(true);
      }

      setLocationError(errorMessage);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Using a free geocoding service (you might want to use Google Maps Geocoding API)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );

      if (response.ok) {
        const data = await response.json();
        return `${data.localityInfo?.administrative?.[2]?.name || ""}, ${data.city || ""}, ${data.principalSubdivision || ""}, ${data.countryName || ""}`.replace(
          /^, |, $/,
          ""
        );
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const searchAddresses = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // Using OpenStreetMap Nominatim for address search (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=IN`
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(
          data.map((item: any) => ({
            id: item.place_id,
            display_name: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            type: item.type,
          }))
        );
      }
    } catch (error) {
      console.error("Error searching addresses:", error);
      setSearchResults([]);
    }
  };

  const handleAddressSearch = (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 300);
  };

  const selectAddress = (address: any) => {
    const locationData: LocationData = {
      latitude: address.latitude,
      longitude: address.longitude,
      accuracy: 10, // Assume good accuracy for selected addresses
      address: address.display_name,
      timestamp: new Date().toISOString(),
    };

    setSelectedAddress(address);
    setCurrentLocation(locationData);
    setSearchResults([]);
    setSearchQuery(address.display_name);
    onLocationSelect?.(locationData);
    onAddressSelect?.(address);

    // Log location usage
    logLocationUsage(locationData, "manual_select");
  };

  const selectSavedAddress = (address: any) => {
    const locationData: LocationData = {
      latitude: address.latitude,
      longitude: address.longitude,
      accuracy: 10,
      address: `${address.line1}, ${address.city}, ${address.state} ${address.pincode}`,
      timestamp: new Date().toISOString(),
    };

    setSelectedAddress(address);
    setCurrentLocation(locationData);
    setManualAddressMode(false);
    onLocationSelect?.(locationData);
    onAddressSelect?.(address);

    logLocationUsage(locationData, "saved_address");
  };

  const logLocationUsage = async (location: LocationData, method: string) => {
    try {
      await fetch("/api/user/location-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "location_used",
          purpose: "delivery_address",
          location,
          method,
          consentGiven: true,
        }),
      });
    } catch (error) {
      console.error("Error logging location usage:", error);
    }
  };

  const switchToManualMode = () => {
    setManualAddressMode(true);
    setLocationError(
      "Location access denied. Please enter your delivery address manually."
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Delivery Address
          {required && <Badge variant="destructive">Required</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Detection */}
        {!manualAddressMode && (
          <div className="space-y-3">
            <Button
              onClick={detectCurrentLocation}
              disabled={isDetectingLocation}
              className="w-full"
              variant="outline"
            >
              {isDetectingLocation ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Detecting Location...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 mr-2" />
                  Use Current Location
                </>
              )}
            </Button>

            {currentLocation && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Location Detected
                  </span>
                </div>
                <p className="text-sm text-green-700">
                  {currentLocation.address}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ±{Math.round(currentLocation.accuracy)}m accuracy •{" "}
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}

            <Button
              onClick={switchToManualMode}
              variant="ghost"
              size="sm"
              className="w-full text-gray-600"
            >
              Enter Address Manually
            </Button>
          </div>
        )}

        {/* Manual Address Entry */}
        {manualAddressMode && (
          <div className="space-y-4">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for your delivery address..."
                  value={searchQuery}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => selectAddress(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.display_name.split(",")[0]}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {result.display_name}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={() => setManualAddressMode(false)}
              variant="ghost"
              size="sm"
              className="w-full text-gray-600"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Try Auto-Detection Again
            </Button>
          </div>
        )}

        {/* Saved Addresses */}
        {savedAddresses.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              Saved Addresses
            </h4>
            <div className="space-y-2">
              {savedAddresses.slice(0, 3).map((address) => (
                <button
                  key={address.id}
                  onClick={() => selectSavedAddress(address)}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {address.addressType === "HOME"
                          ? "🏠 Home"
                          : address.addressType === "WORK"
                            ? "💼 Work"
                            : "📍 Other"}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {address.line1}, {address.city}, {address.state}{" "}
                        {address.pincode}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Messages */}
        {locationError && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {locationError}
              {required && (
                <p className="mt-2 text-sm">
                  <strong>Note:</strong> Without location access, delivery time
                  estimates may be less accurate.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Location Status */}
        {currentLocation && !locationError && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>Delivery address confirmed</span>
            <Clock className="h-3 w-3 ml-auto" />
            <span className="text-xs">
              {new Date(currentLocation.timestamp).toLocaleTimeString()}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
