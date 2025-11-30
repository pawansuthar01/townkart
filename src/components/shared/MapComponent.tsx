"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import LocationService, {
  LocationData,
  DeliveryZone,
} from "@/lib/locationService";

interface MapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    type?: "user" | "store" | "delivery";
  }>;
  deliveryZones?: DeliveryZone[];
  height?: string;
  showControls?: boolean;
  onLocationSelect?: (location: LocationData) => void;
  className?: string;
}

export function MapComponent({
  center = { lat: 28.6139, lng: 77.209 }, // Default to Delhi
  zoom = 12,
  markers = [],
  deliveryZones = [],
  height = "400px",
  showControls = true,
  onLocationSelect,
  className = "",
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );

  // Initialize map (using a simple approach - in production you'd use Google Maps or Mapbox)
  useEffect(() => {
    const initializeMap = async () => {
      setIsLoading(true);

      // Simulate map loading
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    };

    initializeMap();
  }, [center, zoom]);

  const handleGetCurrentLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
      setSelectedLocation(location);
      onLocationSelect?.(location);
    } catch (error) {
      console.error("Failed to get location:", error);
    }
  };

  const handleMapClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onLocationSelect) return;

    // In a real implementation, you'd get coordinates from the map click
    // For now, we'll simulate getting the user's current location
    try {
      const location = await LocationService.getCurrentLocation();
      setSelectedLocation(location);
      onLocationSelect(location);
    } catch (error) {
      console.error("Failed to select location:", error);
    }
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {/* Map Container */}
      <div
        ref={mapRef}
        className="relative bg-gray-100 cursor-crosshair"
        style={{ height }}
        onClick={handleMapClick}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        ) : (
          <div className="relative h-full bg-gradient-to-br from-blue-50 to-green-50">
            {/* Simple map representation - in production, use actual map library */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">Interactive Map</p>
                <p className="text-xs">Click to select location</p>
              </div>
            </div>

            {/* Markers */}
            {markers.map((marker, index) => (
              <div
                key={index}
                className="absolute transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 40}%`,
                  top: `${50 + (Math.random() - 0.5) * 40}%`,
                }}
              >
                <div className="relative">
                  <MapPin
                    className={`h-6 w-6 ${
                      marker.type === "user"
                        ? "text-blue-500"
                        : marker.type === "store"
                          ? "text-green-500"
                          : "text-red-500"
                    }`}
                  />
                  {marker.title && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {marker.title}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* User Location Marker */}
            {userLocation && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-full z-10"
                style={{
                  left: "60%",
                  top: "40%",
                }}
              >
                <div className="relative">
                  <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Your Location
                  </div>
                </div>
              </div>
            )}

            {/* Selected Location Marker */}
            {selectedLocation && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-full z-20"
                style={{
                  left: "40%",
                  top: "60%",
                }}
              >
                <div className="relative">
                  <MapPin className="h-8 w-8 text-red-500" />
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Selected
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 space-y-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleGetCurrentLocation}
            className="bg-white shadow-md hover:bg-gray-50"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Current Location
          </Button>

          {deliveryZones.length > 0 && (
            <div className="bg-white rounded-lg p-3 shadow-md">
              <h4 className="text-sm font-medium mb-2">Delivery Zones</h4>
              <div className="space-y-1">
                {deliveryZones.slice(0, 3).map((zone) => (
                  <Badge key={zone.id} variant="outline" className="text-xs">
                    {zone.name}
                  </Badge>
                ))}
                {deliveryZones.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{deliveryZones.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Location Info */}
      {(userLocation || selectedLocation) && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg p-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">
                  {selectedLocation?.address ||
                    userLocation?.address ||
                    "Selected Location"}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedLocation
                    ? `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
                    : userLocation
                      ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
                      : ""}
                </p>
              </div>
            </div>
            {selectedLocation && onLocationSelect && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onLocationSelect(selectedLocation)}
              >
                Confirm Location
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default MapComponent;
