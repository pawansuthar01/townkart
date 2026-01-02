"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store,
  Plus,
  Eye,
  Edit,
  Star,
  User,
  UserCheck,
  UserX,
  Search,
  RefreshCw,
  Loader2,
  Check,
  X,
  Clock,
  Map,
  List,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  MapIntegration,
  MapLocation,
  MapMarker,
} from "@/components/shared/MapIntegration";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface StoreData {
  id: string;
  name: string;
  code: string;
  category: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  manager: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  isActive: boolean;
  applicationStatus: string;
  isVerified: boolean;
  averageRating: number;
  totalOrders: number;
  totalRevenue: number;
  ordersCount: number;
  createdAt: string;
}

interface StoreManager {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  userRoles: string[];
  createdAt: string;
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreData[]>([]);
  const [pendingStores, setPendingStores] = useState<StoreData[]>([]);
  const [storeManagers, setStoreManagers] = useState<StoreManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [pendingCount, setPendingCount] = useState(0);
  const [activeTab, setActiveTab] = useState("stores");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Add Store dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<MapLocation>({
    latitude: 29.1492, // Hanumangarh center
    longitude: 74.124,
  });
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [storeFormData, setStoreFormData] = useState({
    name: "",
    code: "",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    category: "",
    latitude: "",
    longitude: "",
    managerId: "",
  });

  // Fetch stores
  const fetchStores = async (page = 1, type = "active") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        type: type,
      });

      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/admin/stores?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (type === "pending") {
          setPendingStores(data.data);
        } else {
          setStores(data.data);
        }
        setPendingCount(data.pendingCount || 0);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending stores
  const fetchPendingStores = async (page = 1) => {
    await fetchStores(page, "pending");
  };

  // Fetch store managers (users with STORE_MANAGER role but no assigned store)
  const fetchStoreManagers = async () => {
    try {
      const response = await fetch(
        "/api/admin/users?role=STORE_MANAGER&hasStore=false"
      );
      if (response.ok) {
        const data = await response.json();
        setStoreManagers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch store managers:", error);
    }
  };
  useEffect(() => {
    fetchStores();
    fetchStoreManagers();
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchStores(1);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    if (activeTab === "pending") {
      fetchPendingStores();
    }
  }, [activeTab]);

  const handleAssignStore = async () => {
    if (!selectedManager || !selectedStore) return;

    try {
      const response = await fetch(
        `/api/admin/stores/${selectedStore}/assign-manager`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ managerId: selectedManager }),
        }
      );

      if (response.ok) {
        alert("Store assigned successfully!");
        setSelectedManager("");
        setSelectedStore("");
        fetchStores();
        fetchStoreManagers();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to assign store");
      }
    } catch (error) {
      console.error("Failed to assign store:", error);
      alert("Failed to assign store");
    }
  };

  const handleRemoveStore = async (storeId: string) => {
    try {
      const response = await fetch(
        `/api/admin/stores/${storeId}/remove-manager`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        alert("Store manager removed successfully!");
        fetchStores();
        fetchStoreManagers();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to remove store manager");
      }
    } catch (error) {
      console.error("Failed to remove store manager:", error);
      alert("Failed to remove store manager");
    }
  };

  const handleStoreAction = async (
    storeId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const response = await fetch(
        `/api/admin/stores?id=${storeId}&action=${action}`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        alert(`Store ${action}d successfully!`);
        fetchStores();
        fetchPendingStores();
      } else {
        const error = await response.json();
        alert(error.message || `Failed to ${action} store`);
      }
    } catch (error) {
      console.error(`Failed to ${action} store:`, error);
      alert(`Failed to ${action} store`);
    }
  };

  // Handle map click to set store coordinates
  const handleMapClick = (location: MapLocation) => {
    setStoreFormData({
      ...storeFormData,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
    });
  };

  // Handle create store
  const handleCreateStore = async () => {
    try {
      const response = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: storeFormData.name,
          code: storeFormData.code,
          description: storeFormData.description,
          address: storeFormData.address,
          city: storeFormData.city,
          state: storeFormData.state,
          pincode: storeFormData.pincode,
          category: storeFormData.category,
          latitude: storeFormData.latitude,
          longitude: storeFormData.longitude,
          managerId: storeFormData.managerId || undefined,
        }),
      });

      if (response.ok) {
        alert("Store created successfully!");
        setIsCreateDialogOpen(false);
        resetStoreForm();
        fetchStores();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create store");
      }
    } catch (error) {
      console.error("Failed to create store:", error);
      alert("Failed to create store");
    }
  };

  // Reset store form
  const resetStoreForm = () => {
    setStoreFormData({
      name: "",
      code: "",
      description: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      category: "",
      latitude: "",
      longitude: "",
      managerId: "",
    });
  };

  // Close dialog
  const closeStoreDialog = () => {
    setIsCreateDialogOpen(false);
    resetStoreForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600">
            Manage stores and store manager assignments
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Store</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store-name">Store Name</Label>
                    <Input
                      id="store-name"
                      placeholder="Enter store name"
                      value={storeFormData.name}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-code">Store Code</Label>
                    <Input
                      id="store-code"
                      placeholder="Unique code"
                      value={storeFormData.code}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          code: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="store-description">Description</Label>
                  <Textarea
                    id="store-description"
                    placeholder="Store description"
                    value={storeFormData.description}
                    onChange={(e) =>
                      setStoreFormData({
                        ...storeFormData,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="store-address">Address</Label>
                  <Textarea
                    id="store-address"
                    placeholder="Full address"
                    value={storeFormData.address}
                    onChange={(e) =>
                      setStoreFormData({
                        ...storeFormData,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="store-city">City</Label>
                    <Input
                      id="store-city"
                      placeholder="City"
                      value={storeFormData.city}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-state">State</Label>
                    <Input
                      id="store-state"
                      placeholder="State"
                      value={storeFormData.state}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          state: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-pincode">Pincode</Label>
                    <Input
                      id="store-pincode"
                      placeholder="Pincode"
                      value={storeFormData.pincode}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          pincode: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="store-category">Category</Label>
                  <Input
                    id="store-category"
                    placeholder="e.g., Grocery, Restaurant"
                    value={storeFormData.category}
                    onChange={(e) =>
                      setStoreFormData({
                        ...storeFormData,
                        category: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="store-manager">Manager (Optional)</Label>
                  <Select
                    value={storeFormData.managerId}
                    onValueChange={(value) =>
                      setStoreFormData({ ...storeFormData, managerId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {storeManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.fullName || "N/A"} ({manager.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store-latitude">Latitude</Label>
                    <Input
                      id="store-latitude"
                      type="number"
                      step="0.000001"
                      placeholder="29.123456"
                      value={storeFormData.latitude}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          latitude: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="store-longitude">Longitude</Label>
                    <Input
                      id="store-longitude"
                      type="number"
                      step="0.000001"
                      placeholder="74.123456"
                      value={storeFormData.longitude}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          longitude: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeStoreDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateStore}
                    disabled={
                      !storeFormData.name ||
                      !storeFormData.code ||
                      !storeFormData.address ||
                      !storeFormData.city ||
                      !storeFormData.state ||
                      !storeFormData.pincode ||
                      !storeFormData.category ||
                      !storeFormData.latitude ||
                      !storeFormData.longitude
                    }
                  >
                    Create Store
                  </Button>
                </div>
              </div>

              {/* Map Section */}
              <div className="space-y-4">
                <div>
                  <Label>Store Location</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Click on the map to set the store location coordinates
                  </p>
                  <MapIntegration
                    center={mapCenter}
                    zoom={12}
                    markers={mapMarkers}
                    onMapClick={handleMapClick}
                    height="400px"
                    interactive={true}
                    showControls={true}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stores">Store Overview</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Applications ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="managers">Manager Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-6">
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
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Stores
                    </CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stores.length}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Stores
                    </CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stores.filter((s) => s.isActive).length}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Orders
                    </CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stores.reduce(
                        (sum, store) => sum + store.ordersCount,
                        0
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <Store className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹
                      {stores
                        .reduce((sum, store) => sum + store.totalRevenue, 0)
                        .toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Stores Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Stores ({stores.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto -mx-6 px-6">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store Name</TableHead>
                          <TableHead>Manager</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="hidden sm:table-cell">
                            Rating
                          </TableHead>
                          <TableHead className="hidden sm:table-cell">
                            Orders
                          </TableHead>
                          <TableHead className="hidden sm:table-cell">
                            Revenue
                          </TableHead>
                          <TableHead className="hidden sm:table-cell">
                            Location
                          </TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stores.map((store) => (
                          <TableRow key={store.id}>
                            <TableCell className="font-medium">
                              {store.name}
                            </TableCell>
                            <TableCell>
                              {store.manager
                                ? store.manager.name
                                : "No Manager"}
                            </TableCell>
                            <TableCell>{store.category}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {store.averageRating.toFixed(1)}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {store.ordersCount}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              ₹{store.totalRevenue.toLocaleString()}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {store.city}, {store.state}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Badge
                                  variant={
                                    store.applicationStatus === "APPROVED"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {store.applicationStatus === "APPROVED"
                                    ? "APPROVED"
                                    : store.applicationStatus}
                                </Badge>
                                <Badge
                                  variant={
                                    store.isActive ? "default" : "secondary"
                                  }
                                >
                                  {store.isActive ? "ACTIVE" : "INACTIVE"}
                                </Badge>
                                <Badge
                                  variant={
                                    store.isVerified ? "default" : "outline"
                                  }
                                >
                                  {store.isVerified ? "VERIFIED" : "UNVERIFIED"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {store.applicationStatus === "PENDING" && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleStoreAction(store.id, "approve")
                                      }
                                    >
                                      <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleStoreAction(store.id, "reject")
                                      }
                                    >
                                      <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Stores Map View</CardTitle>
                  <p className="text-sm text-gray-600">
                    View all stores on the map. Click on markers for details.
                  </p>
                </CardHeader>
                <CardContent>
                  <MapIntegration
                    center={mapCenter}
                    zoom={10}
                    markers={stores
                      .filter((store) => store.latitude && store.longitude)
                      .map((store) => ({
                        id: store.id,
                        latitude: store.latitude,
                        longitude: store.longitude,
                        title: store.name,
                        address: store.address,
                        type: "shop",
                        infoWindow: `
                          <div class="p-2">
                            <h3 class="font-semibold">${store.name}</h3>
                            <p class="text-sm text-gray-600">${store.address}</p>
                            <p class="text-sm">${store.city}, ${store.state}</p>
                            <p class="text-sm">Manager: ${store.manager?.name || "No Manager"}</p>
                            <p class="text-sm">Status: ${store.isActive ? "Active" : "Inactive"}</p>
                            <p class="text-sm">Orders: ${store.ordersCount}</p>
                          </div>
                        `,
                      }))}
                    height="600px"
                    interactive={true}
                    showControls={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Applications Management</CardTitle>
              <p className="text-sm text-gray-600">
                Store applications are now managed in the Applications section
                for better organization.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  All store manager applications for active and verified stores
                  are now displayed in the
                  <strong> Applications </strong> page.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild variant="outline">
                    <a href="/admin/applications">Go to Applications</a>
                  </Button>
                  <Button variant="default">Verify & Activate Stores</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="managers" className="space-y-6">
          {/* Store Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assign Store to Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Select Store Manager
                  </label>
                  <Select
                    value={selectedManager}
                    onValueChange={setSelectedManager}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {storeManagers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.fullName || "N/A"} ({manager.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Select Store</label>
                  <Select
                    value={selectedStore}
                    onValueChange={setSelectedStore}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAssignStore} className="w-full">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Assign Store
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waiting Store Managers */}
          <Card>
            <CardHeader>
              <CardTitle>Store Managers Waiting for Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Phone
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Applied Date
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storeManagers.map((manager) => (
                      <TableRow key={manager.id}>
                        <TableCell className="font-medium">
                          {manager.fullName || "N/A"}
                        </TableCell>
                        <TableCell>{manager.email}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {manager.phoneNumber || "N/A"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {new Date(manager.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">WAITING_FOR_STORE</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedManager(manager.id)}
                          >
                            Assign Store
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Current Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Current Store Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Manager Email
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores
                      .filter((store) => store.manager)
                      .map((store) => (
                        <TableRow key={store.id}>
                          <TableCell className="font-medium">
                            {store.name}
                          </TableCell>
                          <TableCell>{store.manager?.name || "N/A"}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {store.manager?.email || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="default">ASSIGNED</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveStore(store.id)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
