"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Users,
  Navigation,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
} from "lucide-react";

interface RiderLocation {
  riderId: string;
  userId: string;
  name: string;
  phoneNumber: string;
  email?: string;
  isAvailable: boolean;
  isActive: boolean;
  vehicleType: string;
  rating: number;
  totalDeliveries: number;
  currentLocation: {
    latitude: number;
    longitude: number;
    lastUpdate: string;
    accuracy?: number;
    speed?: number;
  } | null;
  activeDelivery: {
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
  } | null;
  recentLocations: Array<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    timestamp: string;
  }>;
}

interface RidersLocationMapProps {
  onRiderSelect?: (rider: RiderLocation) => void;
}

export function RidersLocationMap({ onRiderSelect }: RidersLocationMapProps) {
  const [riders, setRiders] = useState<RiderLocation[]>([]);
  const [filteredRiders, setFilteredRiders] = useState<RiderLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRider, setSelectedRider] = useState<RiderLocation | null>(
    null,
  );
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "available" | "busy" | "offline"
  >("all");
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch riders locations
  const fetchRidersLocations = async () => {
    try {
      const params = new URLSearchParams({
        includeInactive: showInactive.toString(),
        limit: "200",
      });

      const response = await fetch(`/api/admin/riders/locations?${params}`);
      const data = await response.json();

      if (data.success) {
        setRiders(data.data.riders);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch riders locations");
      }
    } catch (err) {
      setError("Failed to connect to location service");
    } finally {
      setLoading(false);
    }
  };

  // Filter riders based on search and status
  useEffect(() => {
    let filtered = riders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (rider) =>
          rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rider.phoneNumber.includes(searchTerm),
      );
    }

    // Status filter
    switch (statusFilter) {
      case "available":
        filtered = filtered.filter(
          (rider) => rider.isAvailable && rider.isActive,
        );
        break;
      case "busy":
        filtered = filtered.filter(
          (rider) => rider.activeDelivery && rider.isActive,
        );
        break;
      case "offline":
        filtered = filtered.filter(
          (rider) => !rider.isActive || !rider.currentLocation,
        );
        break;
    }

    setFilteredRiders(filtered);
  }, [riders, searchTerm, statusFilter]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchRidersLocations();

    refreshIntervalRef.current = setInterval(() => {
      fetchRidersLocations();
    }, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [showInactive]);

  const getStatusBadge = (rider: RiderLocation) => {
    if (!rider.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (rider.activeDelivery) {
      return <Badge className="bg-orange-500">On Delivery</Badge>;
    }

    if (rider.isAvailable && rider.currentLocation) {
      return <Badge className="bg-green-500">Available</Badge>;
    }

    if (rider.currentLocation) {
      return <Badge className="bg-yellow-500">Online</Badge>;
    }

    return <Badge variant="outline">Offline</Badge>;
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case "bike":
        return "🏍️";
      case "car":
        return "🚗";
      case "van":
        return "🚐";
      default:
        return "🚲";
    }
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading riders locations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <MapPin className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold">Location Service Unavailable</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchRidersLocations}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{riders.length}</div>
            <div className="text-sm text-gray-600">Total Riders</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {riders.filter((r) => r.isAvailable && r.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Available</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {riders.filter((r) => r.activeDelivery).length}
            </div>
            <div className="text-sm text-gray-600">On Delivery</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {riders.filter((r) => r.currentLocation).length}
            </div>
            <div className="text-sm text-gray-600">Online</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value: any) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">On Delivery</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showInactive ? "Hide" : "Show"} Inactive
            </Button>

            <Button variant="outline" onClick={fetchRidersLocations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Riders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Riders Locations ({filteredRiders.length})
            </span>
            <Badge variant="outline">Auto-refresh: 30s</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredRiders.map((rider) => (
              <div
                key={rider.riderId}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRider?.riderId === rider.riderId
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => {
                  setSelectedRider(rider);
                  onRiderSelect?.(rider);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getVehicleIcon(rider.vehicleType)}
                    </span>
                    <div>
                      <h3 className="font-semibold">{rider.name}</h3>
                      <p className="text-sm text-gray-600">
                        {rider.phoneNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(rider)}
                    {rider.rating > 0 && (
                      <Badge variant="outline">
                        ⭐ {rider.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Deliveries:</span>
                    <span className="ml-1 font-medium">
                      {rider.totalDeliveries}
                    </span>
                  </div>

                  {rider.currentLocation && (
                    <div>
                      <span className="text-gray-600">Last Update:</span>
                      <span className="ml-1 font-medium">
                        {formatLastUpdate(rider.currentLocation.lastUpdate)}
                      </span>
                    </div>
                  )}

                  {rider.activeDelivery && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Current Order:</span>
                      <span className="ml-1 font-medium">
                        {rider.activeDelivery.orderNumber} -{" "}
                        {rider.activeDelivery.customerName}
                      </span>
                    </div>
                  )}
                </div>

                {rider.currentLocation && (
                  <div className="mt-2 text-xs text-gray-500">
                    📍 {rider.currentLocation.latitude.toFixed(6)},{" "}
                    {rider.currentLocation.longitude.toFixed(6)}
                    {rider.currentLocation.speed && (
                      <span className="ml-2">
                        🚀 {rider.currentLocation.speed} km/h
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredRiders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No riders found matching your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Rider Details */}
      {selectedRider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Navigation className="h-5 w-5 mr-2" />
              {selectedRider.name} - Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <p>
                    <strong>Phone:</strong> {selectedRider.phoneNumber}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {selectedRider.email || "Not provided"}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Performance</h4>
                  <p>
                    <strong>Rating:</strong> ⭐{" "}
                    {selectedRider.rating.toFixed(1)}
                  </p>
                  <p>
                    <strong>Total Deliveries:</strong>{" "}
                    {selectedRider.totalDeliveries}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {selectedRider.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedRider.currentLocation && (
                  <div>
                    <h4 className="font-semibold mb-2">Current Location</h4>
                    <p>
                      <strong>Coordinates:</strong>{" "}
                      {selectedRider.currentLocation.latitude.toFixed(6)},{" "}
                      {selectedRider.currentLocation.longitude.toFixed(6)}
                    </p>
                    <p>
                      <strong>Last Update:</strong>{" "}
                      {formatLastUpdate(
                        selectedRider.currentLocation.lastUpdate,
                      )}
                    </p>
                    {selectedRider.currentLocation.speed && (
                      <p>
                        <strong>Speed:</strong>{" "}
                        {selectedRider.currentLocation.speed} km/h
                      </p>
                    )}
                    {selectedRider.currentLocation.accuracy && (
                      <p>
                        <strong>Accuracy:</strong> ±
                        {selectedRider.currentLocation.accuracy}m
                      </p>
                    )}
                  </div>
                )}

                {selectedRider.activeDelivery && (
                  <div>
                    <h4 className="font-semibold mb-2">Current Delivery</h4>
                    <p>
                      <strong>Order:</strong>{" "}
                      {selectedRider.activeDelivery.orderNumber}
                    </p>
                    <p>
                      <strong>Customer:</strong>{" "}
                      {selectedRider.activeDelivery.customerName}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {selectedRider.activeDelivery.status}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
