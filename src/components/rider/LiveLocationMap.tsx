"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Navigation,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react";
import { loadGoogleMaps } from "@/lib/googleMapsLoader";
import { LocationData } from "@/services/location.service";

interface LiveLocationMapProps {
  locationData: LocationData | null;
  isTracking: boolean;
  accuracyIssue?: boolean;
  accuracyWarningTime?: number | null;
  showTroubleshooting?: boolean;
  onRetry: () => void;
  onToggleHelp: () => void;
  className?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

export function LiveLocationMap({
  locationData,
  isTracking,
  accuracyIssue = false,
  accuracyWarningTime = null,
  showTroubleshooting = false,
  onRetry,
  onToggleHelp,
  className = "",
}: LiveLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  /* ---------------- LOAD MAP ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        if (!window.google) {
          await loadGoogleMaps(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!, [
            "geometry",
          ]);
        }
        setMapLoaded(true);
      } catch (e) {
        console.error(e);
        setMapError("Failed to load Google Maps");
      }
    };

    init();
  }, []);

  /* ---------------- INIT MAP ---------------- */
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const defaultLocation = { lat: 26.6139, lng: 74.209 };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: defaultLocation,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    markerRef.current = new window.google.maps.Marker({
      map: mapInstanceRef.current,
      position: defaultLocation,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#39B54A",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
    });

    accuracyCircleRef.current = new window.google.maps.Circle({
      map: mapInstanceRef.current,
      center: defaultLocation,
      radius: 50,
      strokeOpacity: 0.3,
      fillOpacity: 0.1,
      strokeColor: "#39B54A",
      fillColor: "#39B54A",
    });
  }, [mapLoaded]);

  /* ---------------- UPDATE POSITION ---------------- */
  useEffect(() => {
    if (!locationData || !mapInstanceRef.current) return;

    const pos = {
      lat: locationData.latitude,
      lng: locationData.longitude,
    };

    markerRef.current?.setPosition(pos);
    accuracyCircleRef.current?.setCenter(pos);
    accuracyCircleRef.current?.setRadius(locationData.accuracy);
    mapInstanceRef.current.setCenter(pos);

    markerRef.current?.setAnimation(window.google.maps.Animation.BOUNCE);
    setTimeout(() => markerRef.current?.setAnimation(null), 1200);
  }, [locationData]);

  if (mapError) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{mapError}</p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => location.reload()}
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Location Map
          </CardTitle>
          <div className="flex items-center gap-2">
            {isTracking && (
              <Badge className="bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                Live Tracking
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsUpdating(true);
                onRetry();
                setTimeout(() => setIsUpdating(false), 800);
              }}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${isUpdating ? "animate-spin" : ""}`}
              />
              Update
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 relative">
        <div ref={mapRef} className="h-80 w-full rounded-b-lg" />

        {locationData && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Current Location</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Lat: {locationData.latitude.toFixed(6)}</div>
              <div>Lng: {locationData.longitude.toFixed(6)}</div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(locationData.timestamp).toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-600" />±
                {Math.round(locationData.accuracy)}m accuracy
              </div>
            </div>
          </div>
        )}

        {/* Accuracy Warning */}
        {accuracyIssue && (
          <div className="absolute top-4 right-4 bg-red-500 text-white rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">
                  Location Accuracy Issue
                </h3>
                <p className="text-sm opacity-90 mt-1">
                  Accuracy is poor. Please use mobile GPS only.
                </p>
                {accuracyWarningTime && (
                  <p className="text-xs opacity-75 mt-2">
                    Action required within{" "}
                    {Math.max(
                      0,
                      Math.round(
                        (10 * 60 * 1000 - (Date.now() - accuracyWarningTime)) /
                          60000
                      )
                    )}{" "}
                    minutes.
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="secondary" onClick={onToggleHelp}>
                    Help
                  </Button>
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Troubleshooting Modal */}
        {showTroubleshooting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">
                Location Troubleshooting
              </h3>

              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside mb-4">
                <li>Enable High Accuracy GPS</li>
                <li>Allow browser location permission</li>
                <li>Use mobile phone only</li>
                <li>Go outdoors for better signal</li>
              </ol>

              <div className="text-sm text-gray-700 space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> 9784740736
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> location@townkart.com
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={onRetry}>
                  Test Location Again
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onToggleHelp}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
