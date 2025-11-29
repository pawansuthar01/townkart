"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MapPin,
  Truck,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  MapIntegration,
  MapMarker,
  MapRoute,
} from "@/components/shared/MapIntegration";
import { DeliveryTrackingData } from "@/lib/deliveryTracking";

interface DeliveryStats {
  totalDeliveries: number;
  activeDeliveries: number;
  completedToday: number;
  averageDeliveryTime: number;
  onTimePercentage: number;
}

export function DeliveryMonitoringDashboard() {
  const [deliveries, setDeliveries] = useState<DeliveryTrackingData[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<
    DeliveryTrackingData[]
  >([]);
  const [stats, setStats] = useState<DeliveryStats>({
    totalDeliveries: 0,
    activeDeliveries: 0,
    completedToday: 0,
    averageDeliveryTime: 0,
    onTimePercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDelivery, setSelectedDelivery] =
    useState<DeliveryTrackingData | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockDeliveries: DeliveryTrackingData[] = [
      {
        delivery: {
          id: "DEL001",
          orderId: "ORD001",
          riderId: "R001",
          status: "in_transit",
          statusMessage: "Package is on the way",
          estimatedDeliveryTime: new Date(Date.now() + 15 * 60 * 1000),
          currentLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
            timestamp: new Date(),
          },
          distanceRemaining: 2.5,
          timeRemaining: 15,
          lastUpdated: new Date(),
        },
        rider: {
          id: "R001",
          name: "Rajesh Kumar",
          phone: "+91-9876543210",
          rating: 4.8,
          vehicleType: "Bike",
          vehicleNumber: "KA-01-AB-1234",
        },
        customer: {
          id: "C001",
          name: "Priya Sharma",
          phone: "+91-9876543211",
          address: {
            fullAddress: "123 MG Road, Bangalore, Karnataka 560001",
            latitude: 12.9816,
            longitude: 77.6046,
          },
        },
        shop: {
          id: "S001",
          name: "Fresh Mart",
          address: {
            fullAddress: "456 Brigade Road, Bangalore, Karnataka 560025",
            latitude: 12.9716,
            longitude: 77.5946,
          },
        },
      },
      {
        delivery: {
          id: "DEL002",
          orderId: "ORD002",
          riderId: "R002",
          status: "assigned",
          statusMessage: "Rider assigned to pickup",
          estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
          distanceRemaining: 5.2,
          timeRemaining: 30,
          lastUpdated: new Date(),
        },
        rider: {
          id: "R002",
          name: "Amit Singh",
          phone: "+91-9876543212",
          rating: 4.6,
          vehicleType: "Scooter",
          vehicleNumber: "KA-02-CD-5678",
        },
        customer: {
          id: "C002",
          name: "Sneha Patel",
          phone: "+91-9876543213",
          address: {
            fullAddress: "789 Residency Road, Bangalore, Karnataka 560025",
            latitude: 12.9616,
            longitude: 77.6146,
          },
        },
        shop: {
          id: "S002",
          name: "Grocery Hub",
          address: {
            fullAddress: "321 Commercial Street, Bangalore, Karnataka 560001",
            latitude: 12.9816,
            longitude: 77.6046,
          },
        },
      },
    ];

    setDeliveries(mockDeliveries);
    setFilteredDeliveries(mockDeliveries);

    // Calculate stats
    const activeDeliveries = mockDeliveries.filter(
      (d) => d.delivery.status !== "delivered",
    ).length;
    setStats({
      totalDeliveries: mockDeliveries.length,
      activeDeliveries,
      completedToday: 12,
      averageDeliveryTime: 28,
      onTimePercentage: 87,
    });

    setLoading(false);
  }, []);

  // Filter deliveries based on search and status
  useEffect(() => {
    let filtered = deliveries;

    if (searchTerm) {
      filtered = filtered.filter(
        (delivery) =>
          delivery.delivery.orderId
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          delivery.customer.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          delivery.rider.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (delivery) => delivery.delivery.status === statusFilter,
      );
    }

    setFilteredDeliveries(filtered);
  }, [deliveries, searchTerm, statusFilter]);

  // Prepare map markers and routes
  const mapMarkers: MapMarker[] = [];
  const mapRoutes: MapRoute[] = [];

  filteredDeliveries.forEach((delivery) => {
    // Add shop marker
    mapMarkers.push({
      id: `shop-${delivery.delivery.id}`,
      latitude: delivery.shop.address.latitude,
      longitude: delivery.shop.address.longitude,
      title: delivery.shop.name,
      type: "shop",
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">${delivery.shop.name}</h3>
          <p class="text-sm text-gray-600">${delivery.shop.address.fullAddress}</p>
          <p class="text-sm text-gray-600">Order: ${delivery.delivery.orderId}</p>
        </div>
      `,
    });

    // Add customer marker
    mapMarkers.push({
      id: `customer-${delivery.delivery.id}`,
      latitude: delivery.customer.address.latitude,
      longitude: delivery.customer.address.longitude,
      title: `Delivery to ${delivery.customer.name}`,
      type: "delivery",
      infoWindow: `
        <div class="p-2">
          <h3 class="font-semibold text-gray-900">${delivery.customer.name}</h3>
          <p class="text-sm text-gray-600">${delivery.customer.address.fullAddress}</p>
          <p class="text-sm text-gray-600">📞 ${delivery.customer.phone}</p>
          <p class="text-sm text-gray-600">Order: ${delivery.delivery.orderId}</p>
        </div>
      `,
    });

    // Add rider marker if location available
    if (delivery.delivery.currentLocation) {
      mapMarkers.push({
        id: `rider-${delivery.delivery.id}`,
        latitude: delivery.delivery.currentLocation.latitude,
        longitude: delivery.delivery.currentLocation.longitude,
        title: delivery.rider.name,
        type: "rider",
        infoWindow: `
          <div class="p-2">
            <h3 class="font-semibold text-gray-900">${delivery.rider.name}</h3>
            <p class="text-sm text-gray-600">⭐ ${delivery.rider.rating} rating</p>
            <p class="text-sm text-gray-600">📞 ${delivery.rider.phone}</p>
            <p class="text-sm text-gray-600">🏍️ ${delivery.rider.vehicleType}</p>
            <p class="text-sm text-gray-600">Order: ${delivery.delivery.orderId}</p>
          </div>
        `,
      });

      // Add route
      mapRoutes.push({
        id: `route-${delivery.delivery.id}`,
        origin: {
          latitude: delivery.delivery.currentLocation.latitude,
          longitude: delivery.delivery.currentLocation.longitude,
        },
        destination: {
          latitude: delivery.customer.address.latitude,
          longitude: delivery.customer.address.longitude,
        },
        color:
          delivery.delivery.status === "in_transit" ? "#f59e0b" : "#6b7280",
        strokeWeight: 3,
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-500";
      case "picked_up":
        return "bg-yellow-500";
      case "in_transit":
        return "bg-orange-500";
      case "delivered":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "assigned":
        return "Assigned";
      case "picked_up":
        return "Picked Up";
      case "in_transit":
        return "In Transit";
      case "delivered":
        return "Delivered";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Delivery Monitoring
          </h2>
          <p className="text-gray-600">
            Monitor all active deliveries with real-time tracking
          </p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDeliveries}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeDeliveries}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedToday}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageDeliveryTime}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">On Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.onTimePercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="map" className="space-y-6">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        {/* Map View */}
        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Live Delivery Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapIntegration
                center={{ latitude: 12.9716, longitude: 77.5946 }}
                zoom={12}
                markers={mapMarkers}
                routes={mapRoutes}
                showControls={true}
                interactive={true}
                showTrafficLayer={true}
                enableGeolocation={false}
                height="600px"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by order ID, customer, or rider..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="picked_up">Picked Up</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Deliveries Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Active Deliveries ({filteredDeliveries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Rider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.delivery.id}>
                      <TableCell className="font-medium">
                        {delivery.delivery.orderId}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {delivery.customer.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {delivery.customer.phone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{delivery.rider.name}</p>
                          <p className="text-sm text-gray-600">
                            ⭐ {delivery.rider.rating}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(delivery.delivery.status)} text-white`}
                        >
                          {getStatusText(delivery.delivery.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {delivery.delivery.distanceRemaining ? (
                          <span>
                            {delivery.delivery.distanceRemaining.toFixed(1)} km
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {delivery.delivery.timeRemaining ? (
                          <span>{delivery.delivery.timeRemaining} min</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDelivery(delivery)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(`tel:${delivery.rider.phone}`)
                            }
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(
                                `https://wa.me/${delivery.rider.phone.replace(/\s+/g, "")}`,
                              )
                            }
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredDeliveries.length === 0 && (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No deliveries found matching your criteria
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delivery Details Modal would go here */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                Delivery Details - {selectedDelivery.delivery.orderId}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Delivery details would be shown here */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDelivery(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
