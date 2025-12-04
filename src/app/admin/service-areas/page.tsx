"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Store,
  Users,
  Loader2,
  Map,
  List,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  MapIntegration,
  MapLocation,
  MapMarker,
} from "@/components/shared/MapIntegration";

interface ServiceArea {
  id: string;
  name: string;
  city: string;
  state: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  isActive: boolean;
  stores: Array<{
    id: string;
    name: string;
    isActive: boolean;
    totalOrders: number;
  }>;
  _count: {
    stores: number;
  };
  createdAt: string;
}

export default function AdminServiceAreasPage() {
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedArea, setSelectedArea] = useState<ServiceArea | null>(null);
  const [mapCenter, setMapCenter] = useState<MapLocation>({
    latitude: 29.1492, // Hanumangarh center
    longitude: 74.124,
  });
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    state: "",
    centerLat: "",
    centerLng: "",
    radiusKm: "",
  });

  // Fetch service areas
  const fetchServiceAreas = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/service-areas");
      if (response.ok) {
        const data = await response.json();
        setServiceAreas(data.data);

        // Create map markers for service areas
        const markers: MapMarker[] = data.data.map((area: ServiceArea) => ({
          id: area.id,
          latitude: area.centerLat,
          longitude: area.centerLng,
          title: area.name,
          address: `${area.city}, ${area.state}`,
          type: "shop",
          infoWindow: `
            <div class="p-2">
              <h3 class="font-semibold">${area.name}</h3>
              <p class="text-sm text-gray-600">${area.city}, ${area.state}</p>
              <p class="text-sm">Radius: ${area.radiusKm} km</p>
              <p class="text-sm">Stores: ${area._count.stores}</p>
              <p class="text-sm">Status: ${area.isActive ? "Active" : "Inactive"}</p>
            </div>
          `,
        }));
        setMapMarkers(markers);
      }
    } catch (error) {
      console.error("Failed to fetch service areas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle map click to set coordinates
  const handleMapClick = (location: MapLocation) => {
    setFormData({
      ...formData,
      centerLat: location.latitude.toString(),
      centerLng: location.longitude.toString(),
    });
  };

  useEffect(() => {
    fetchServiceAreas();
  }, []);

  const handleCreateArea = async () => {
    try {
      const response = await fetch("/api/admin/service-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          city: formData.city,
          state: formData.state,
          centerLat: parseFloat(formData.centerLat),
          centerLng: parseFloat(formData.centerLng),
          radiusKm: parseFloat(formData.radiusKm),
        }),
      });

      if (response.ok) {
        alert("Service area created successfully!");
        setIsCreateDialogOpen(false);
        resetForm();
        fetchServiceAreas();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create service area");
      }
    } catch (error) {
      console.error("Failed to create service area:", error);
      alert("Failed to create service area");
    }
  };

  const handleEditArea = async () => {
    if (!selectedArea) return;

    try {
      const response = await fetch(
        `/api/admin/service-areas/${selectedArea.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            city: formData.city,
            state: formData.state,
            centerLat: parseFloat(formData.centerLat),
            centerLng: parseFloat(formData.centerLng),
            radiusKm: parseFloat(formData.radiusKm),
          }),
        }
      );

      if (response.ok) {
        alert("Service area updated successfully!");
        setIsCreateDialogOpen(false);
        setIsEditing(false);
        setSelectedArea(null);
        resetForm();
        fetchServiceAreas();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update service area");
      }
    } catch (error) {
      console.error("Failed to update service area:", error);
      alert("Failed to update service area");
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    if (!confirm("Are you sure you want to delete this service area?")) return;

    try {
      const response = await fetch(`/api/admin/service-areas/${areaId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Service area deleted successfully!");
        fetchServiceAreas();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete service area");
      }
    } catch (error) {
      console.error("Failed to delete service area:", error);
      alert("Failed to delete service area");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      city: "",
      state: "",
      centerLat: "",
      centerLng: "",
      radiusKm: "",
    });
  };

  const openEditDialog = (area: ServiceArea) => {
    setSelectedArea(area);
    setFormData({
      name: area.name,
      city: area.city,
      state: area.state,
      centerLat: area.centerLat.toString(),
      centerLng: area.centerLng.toString(),
      radiusKm: area.radiusKm.toString(),
    });
    setIsEditing(true);
    setIsCreateDialogOpen(true);
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setIsEditing(false);
    setSelectedArea(null);
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Areas</h1>
          <p className="text-gray-600">
            Manage delivery service areas and coverage zones
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsEditing(false)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Service Area
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Service Area" : "Create Service Area"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Area Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Hanumangarh Junction"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="centerLat">Center Latitude</Label>
                  <Input
                    id="centerLat"
                    type="number"
                    step="0.000001"
                    placeholder="29.123456"
                    value={formData.centerLat}
                    onChange={(e) =>
                      setFormData({ ...formData, centerLat: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="centerLng">Center Longitude</Label>
                  <Input
                    id="centerLng"
                    type="number"
                    step="0.000001"
                    placeholder="74.123456"
                    value={formData.centerLng}
                    onChange={(e) =>
                      setFormData({ ...formData, centerLng: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="radiusKm">Radius (km)</Label>
                <Input
                  id="radiusKm"
                  type="number"
                  step="0.1"
                  placeholder="10"
                  value={formData.radiusKm}
                  onChange={(e) =>
                    setFormData({ ...formData, radiusKm: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={isEditing ? handleEditArea : handleCreateArea}
                  disabled={
                    !formData.name ||
                    !formData.city ||
                    !formData.state ||
                    !formData.centerLat ||
                    !formData.centerLng ||
                    !formData.radiusKm
                  }
                >
                  {isEditing ? "Update" : "Create"} Area
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Service Areas
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceAreas.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Areas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceAreas.filter((area) => area.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceAreas.reduce((sum, area) => sum + area._count.stores, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">
            <List className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="map">
            <Map className="mr-2 h-4 w-4" />
            Map View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Service Areas Table */}
          <Card>
            <CardHeader>
              <CardTitle>Service Areas ({serviceAreas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Center Coordinates</TableHead>
                    <TableHead>Radius</TableHead>
                    <TableHead>Stores</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceAreas.map((area) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium">{area.name}</TableCell>
                      <TableCell>
                        {area.city}, {area.state}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {area.centerLat.toFixed(6)}, {area.centerLng.toFixed(6)}
                      </TableCell>
                      <TableCell>{area.radiusKm} km</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Store className="h-4 w-4" />
                          {area._count.stores}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={area.isActive ? "default" : "secondary"}
                        >
                          {area.isActive ? "ACTIVE" : "INACTIVE"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(area)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArea(area.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Areas Map</CardTitle>
              <p className="text-sm text-gray-600">
                Click on the map to set coordinates for new service areas
              </p>
            </CardHeader>
            <CardContent>
              <MapIntegration
                center={mapCenter}
                zoom={10}
                markers={mapMarkers}
                onMapClick={handleMapClick}
                height="500px"
                interactive={true}
                showControls={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
