"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Crosshair,
} from "lucide-react";

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

export interface MapLocation {
  latitude: number;
  longitude: number;
  address?: string;
  title?: string;
  type?: "pickup" | "delivery" | "rider" | "shop";
}

export interface MapMarker extends MapLocation {
  id: string;
  icon?: string;
  infoWindow?: string;
  draggable?: boolean;
  onDragEnd?: (location: MapLocation) => void;
}

export interface MapRoute {
  id: string;
  origin: MapLocation;
  destination: MapLocation;
  waypoints?: MapLocation[];
  color?: string;
  strokeWeight?: number;
  showTraffic?: boolean;
}

interface MapIntegrationProps {
  center?: MapLocation;
  zoom?: number;
  markers?: MapMarker[];
  routes?: MapRoute[];
  onMapClick?: (location: MapLocation) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  showControls?: boolean;
  mapType?: "roadmap" | "satellite" | "hybrid" | "terrain";
  className?: string;
  height?: string;
  interactive?: boolean;
  showTrafficLayer?: boolean;
  enableGeolocation?: boolean;
}

export function MapIntegration({
  center = { latitude: 12.9716, longitude: 77.5946 }, // Bangalore center
  zoom = 14,
  markers = [],
  routes = [],
  onMapClick,
  onMarkerClick,
  showControls = true,
  mapType = "roadmap",
  className = "",
  height = "400px",
  interactive = true,
  showTrafficLayer = false,
  enableGeolocation = false,
}: MapIntegrationProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [mapMarkers, setMapMarkers] = useState<Map<string, any>>(new Map());
  const [mapRoutes, setMapRoutes] = useState<Map<string, any>>(new Map());
  const [trafficLayer, setTrafficLayer] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<MapLocation | null>(
    null,
  );

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    let timeoutId: NodeJS.Timeout;

    // Load Google Maps API if not already loaded
    if (!window.google) {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error("Google Maps API key not found");
        setMapError(
          "Google Maps API key is not configured. Please check your environment variables.",
        );
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places,directions`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        console.error("Failed to load Google Maps API");
        setMapError(
          "Failed to load map. Please check your internet connection and try again.",
        );
      };

      // Listen for Google Maps authentication errors
      window.addEventListener("error", (event) => {
        if (event.message && event.message.includes("Google Maps")) {
          setMapError(
            "Google Maps API key is not authorized for this domain. Please check your API key restrictions.",
          );
        }
      });
      document.head.appendChild(script);

      // Set a timeout for loading
      timeoutId = setTimeout(() => {
        if (!isMapLoaded && !mapError) {
          setMapError(
            "Map loading timed out. Please check your Google Maps API key.",
          );
        }
      }, 10000); // 10 second timeout
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!mapRef.current || !window.google) return;

      let mapInstance: any;

      try {
        const mapOptions = {
          center: {
            lat: center.latitude,
            lng: center.longitude,
          },
          zoom: zoom,
          mapTypeId: getMapTypeId(mapType),
          disableDefaultUI: !interactive,
          zoomControl: interactive && showControls,
          mapTypeControl: interactive && showControls,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: interactive && showControls,
          gestureHandling: interactive ? "auto" : "none",
          styles: getMapStyles(),
        };

        mapInstance = new window.google.maps.Map(mapRef.current, mapOptions);

        // Listen for authentication errors
        window.google.maps.event.addListenerOnce(
          mapInstance,
          "tilesloaded",
          () => {
            // Map loaded successfully
            setMap(mapInstance);
            setIsMapLoaded(true);
            setMapError(null); // Clear any timeout errors
            clearTimeout(timeoutId); // Clear the timeout
          },
        );

        // Handle authentication errors
        window.google.maps.event.addListenerOnce(
          mapInstance,
          "auth_failure",
          () => {
            setMapError(
              "Google Maps authentication failed. Please check your API key configuration.",
            );
            clearTimeout(timeoutId);
          },
        );
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
        setMapError(
          "Failed to initialize map. Please check your Google Maps API key.",
        );
      }

      // Add event listeners
      if (onMapClick) {
        mapInstance.addListener("click", (event: any) => {
          const location: MapLocation = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng(),
          };
          onMapClick(location);
        });
      }

      // Initialize traffic layer
      if (showTrafficLayer) {
        const traffic = new window.google.maps.TrafficLayer();
        traffic.setMap(mapInstance);
        setTrafficLayer(traffic);
      }

      // Get current location if enabled
      if (enableGeolocation && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location: MapLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              type: "rider",
            };
            setCurrentLocation(location);
          },
          (error) => {
            console.error("Error getting current location:", error);
          },
        );
      }
    }
  }, [
    center,
    zoom,
    mapType,
    interactive,
    showControls,
    showTrafficLayer,
    enableGeolocation,
  ]);

  // Update markers when markers prop changes
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    // Clear existing markers
    mapMarkers.forEach((marker) => marker.setMap(null));
    setMapMarkers(new Map());

    // Add new markers
    const newMarkers = new Map<string, any>();
    markers.forEach((marker) => {
      const markerInstance = createMarker(map, marker);
      newMarkers.set(marker.id, markerInstance);
    });
    setMapMarkers(newMarkers);
  }, [map, markers, isMapLoaded]);

  // Update routes when routes prop changes
  useEffect(() => {
    if (!map || !isMapLoaded) return;

    // Clear existing routes
    mapRoutes.forEach((route) => {
      if (route.directionsRenderer) {
        route.directionsRenderer.setMap(null);
      }
      if (route.polyline) {
        route.polyline.setMap(null);
      }
    });
    setMapRoutes(new Map());

    // Add new routes
    const newRoutes = new Map<string, any>();
    routes.forEach((route) => {
      const routeInstance = createRoute(map, route);
      newRoutes.set(route.id, routeInstance);
    });
    setMapRoutes(newRoutes);
  }, [map, routes, isMapLoaded]);

  // Create marker
  const createMarker = useCallback(
    (mapInstance: any, marker: MapMarker) => {
      const markerOptions = {
        position: {
          lat: marker.latitude,
          lng: marker.longitude,
        },
        map: mapInstance,
        title: marker.title || marker.address,
        icon: getMarkerIcon(marker),
        draggable: marker.draggable || false,
      };

      const markerInstance = new window.google.maps.Marker(markerOptions);

      // Add info window if provided
      if (marker.infoWindow) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: marker.infoWindow,
        });

        markerInstance.addListener("click", () => {
          infoWindow.open(mapInstance, markerInstance);
          onMarkerClick?.(marker);
        });
      } else {
        markerInstance.addListener("click", () => {
          onMarkerClick?.(marker);
        });
      }

      // Handle drag end
      if (marker.draggable && marker.onDragEnd) {
        markerInstance.addListener("dragend", (event: any) => {
          const newLocation: MapLocation = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng(),
            address: marker.address,
            title: marker.title,
            type: marker.type,
          };
          marker.onDragEnd!(newLocation);
        });
      }

      return markerInstance;
    },
    [onMarkerClick],
  );

  // Create route
  const createRoute = useCallback((mapInstance: any, route: MapRoute) => {
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: route.color || "#f59e0b",
        strokeWeight: route.strokeWeight || 4,
      },
    });

    const request = {
      origin: {
        lat: route.origin.latitude,
        lng: route.origin.longitude,
      },
      destination: {
        lat: route.destination.latitude,
        lng: route.destination.longitude,
      },
      waypoints: route.waypoints?.map((wp) => ({
        location: {
          lat: wp.latitude,
          lng: wp.longitude,
        },
        stopover: true,
      })),
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    };

    directionsService.route(request, (result: any, status: any) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
      } else {
        console.error("Directions request failed:", status);
        // Fallback to simple polyline
        const polyline = new window.google.maps.Polyline({
          path: [
            { lat: route.origin.latitude, lng: route.origin.longitude },
            ...(route.waypoints?.map((wp) => ({
              lat: wp.latitude,
              lng: wp.longitude,
            })) || []),
            {
              lat: route.destination.latitude,
              lng: route.destination.longitude,
            },
          ],
          geodesic: true,
          strokeColor: route.color || "#f59e0b",
          strokeOpacity: 0.8,
          strokeWeight: route.strokeWeight || 4,
        });
        polyline.setMap(mapInstance);
        return { polyline };
      }
    });

    return { directionsRenderer };
  }, []);

  // Get marker icon based on type
  const getMarkerIcon = (marker: MapMarker) => {
    if (marker.icon) return marker.icon;

    const icons = {
      pickup: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="4"/>
            <rect x="12" y="14" width="16" height="12" rx="2" fill="white"/>
            <rect x="16" y="18" width="8" height="2" fill="#10b981"/>
            <rect x="16" y="22" width="8" height="2" fill="#10b981"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      },
      delivery: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="4"/>
            <path d="M20 10l6 6-6 10-6-10 6-6z" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      },
      rider: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="white" stroke-width="4"/>
            <path d="M14 26l12-8-12-8v16z" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      },
      shop: {
        url:
          "data:image/svg+xml;charset=UTF-8," +
          encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#8b5cf6" stroke="white" stroke-width="4"/>
            <path d="M12 28h16l-2-8h-12l-2 8z" fill="white"/>
            <circle cx="16" cy="20" r="2" fill="#8b5cf6"/>
            <circle cx="20" cy="20" r="2" fill="#8b5cf6"/>
            <circle cx="24" cy="20" r="2" fill="#8b5cf6"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      },
    };

    return icons[marker.type as keyof typeof icons] || icons.delivery;
  };

  // Get map type ID
  const getMapTypeId = (type: string) => {
    const types = {
      roadmap: window.google?.maps?.MapTypeId.ROADMAP,
      satellite: window.google?.maps?.MapTypeId.SATELLITE,
      hybrid: window.google?.maps?.MapTypeId.HYBRID,
      terrain: window.google?.maps?.MapTypeId.TERRAIN,
    };
    return types[type as keyof typeof types] || types.roadmap;
  };

  // Custom map styles for better UX
  const getMapStyles = () => [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ];

  // Map controls
  const zoomIn = () => map?.setZoom((map.getZoom() || 0) + 1);
  const zoomOut = () => map?.setZoom((map.getZoom() || 0) - 1);
  const resetView = () => {
    map?.setCenter({ lat: center.latitude, lng: center.longitude });
    map?.setZoom(zoom);
  };
  const toggleTraffic = () => {
    if (trafficLayer) {
      trafficLayer.setMap(null);
      setTrafficLayer(null);
    } else {
      const newTrafficLayer = new window.google.maps.TrafficLayer();
      newTrafficLayer.setMap(map);
      setTrafficLayer(newTrafficLayer);
    }
  };
  const goToCurrentLocation = () => {
    if (currentLocation && map) {
      map.setCenter({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      });
      map.setZoom(16);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Map View
          </CardTitle>
          {showControls && interactive && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={toggleTraffic}>
                <Layers className="h-4 w-4" />
              </Button>
              {enableGeolocation && currentLocation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToCurrentLocation}
                >
                  <Crosshair className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full rounded-b-lg" style={{ height }}>
          <div ref={mapRef} className="w-full h-full rounded-b-lg"></div>
          {!isMapLoaded && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-b-lg z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-b-lg z-10">
              <div className="text-center">
                <div className="text-red-500 mb-2">
                  <svg
                    className="h-12 w-12 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="text-sm text-red-600 mb-2 max-w-md">
                  <p className="mb-2">{mapError}</p>
                  {mapError.includes("API key") && (
                    <div className="text-xs text-gray-600">
                      <p className="mb-1">To fix this:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to Google Cloud Console</li>
                        <li>Navigate to APIs & Services → Credentials</li>
                        <li>Edit your API key</li>
                        <li>
                          Add{" "}
                          <code className="bg-gray-200 px-1 rounded">
                            localhost:3000
                          </code>{" "}
                          to website restrictions
                        </li>
                        <li>Save and try again</li>
                      </ol>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map Legend */}
        {markers.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-b-lg">
            <div className="flex flex-wrap gap-4 text-sm">
              {markers.some((m) => m.type === "pickup") && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>Pickup Location</span>
                </div>
              )}
              {markers.some((m) => m.type === "delivery") && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span>Delivery Location</span>
                </div>
              )}
              {markers.some((m) => m.type === "rider") && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span>Rider Location</span>
                </div>
              )}
              {markers.some((m) => m.type === "shop") && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span>Shop Location</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for using map integration
export function useMapIntegration(options: Partial<MapIntegrationProps> = {}) {
  const [markers, setMarkers] = useState<MapMarker[]>(options.markers || []);
  const [routes, setRoutes] = useState<MapRoute[]>(options.routes || []);
  const [center, setCenter] = useState<MapLocation>(
    options.center || {
      latitude: 12.9716,
      longitude: 77.5946,
    },
  );

  const addMarker = useCallback((marker: MapMarker) => {
    setMarkers((prev) => [...prev, marker]);
  }, []);

  const removeMarker = useCallback((markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
  }, []);

  const updateMarker = useCallback(
    (markerId: string, updates: Partial<MapMarker>) => {
      setMarkers((prev) =>
        prev.map((m) => (m.id === markerId ? { ...m, ...updates } : m)),
      );
    },
    [],
  );

  const addRoute = useCallback((route: MapRoute) => {
    setRoutes((prev) => [...prev, route]);
  }, []);

  const removeRoute = useCallback((routeId: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
  }, []);

  const clearAll = useCallback(() => {
    setMarkers([]);
    setRoutes([]);
  }, []);

  return {
    markers,
    routes,
    center,
    setCenter,
    addMarker,
    removeMarker,
    updateMarker,
    addRoute,
    removeRoute,
    clearAll,
  };
}
