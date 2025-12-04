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
} from "lucide-react";
import { useState, useEffect } from "react";

// Prevent automatic scrolling
if (typeof window !== "undefined") {
  window.history.scrollRestoration = "manual";
}

interface StoreData {
  id: string;
  name: string;
  code: string;
  category: string;
  address: string;
  city: string;
  state: string;
  manager: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  isActive: boolean;
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
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
    fetchPendingStores();
    fetchStoreManagers();

    // Prevent automatic scrolling
    const preventAutoScroll = () => {
      if (window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    };

    // Prevent scroll restoration
    window.history.scrollRestoration = "manual";

    // Add a small delay to prevent any auto-scrolling
    const timer = setTimeout(preventAutoScroll, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchStores(1);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, statusFilter]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Management</h1>
          <p className="text-gray-600">
            Manage stores and store manager assignments
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Store
        </Button>
      </div>

      <Tabs defaultValue="stores" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stores">Store Overview</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Applications ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="managers">Manager Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="space-y-6">
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
                  {stores.reduce((sum, store) => sum + store.ordersCount, 0)}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Location</TableHead>
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
                        {store.manager ? store.manager.name : "No Manager"}
                      </TableCell>
                      <TableCell>{store.category}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {store.averageRating.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell>{store.ordersCount}</TableCell>
                      <TableCell>
                        ₹{store.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {store.city}, {store.state}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge
                            variant={store.isActive ? "default" : "secondary"}
                          >
                            {store.isActive ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                          <Badge
                            variant={store.isVerified ? "default" : "outline"}
                          >
                            {store.isVerified ? "VERIFIED" : "UNVERIFIED"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!store.isActive && (
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          {/* Pending Applications Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Applications
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingStores.length}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Review Time
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24-48h</div>
                <p className="text-xs text-muted-foreground">
                  Standard processing time
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Store Applications ({pendingStores.length})</CardTitle>
              <p className="text-sm text-gray-600">
                Review and approve store registration applications
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingStores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">
                        {store.name}
                      </TableCell>
                      <TableCell>
                        {store.manager ? (
                          <div>
                            <div className="font-medium">
                              {store.manager.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {store.manager.email}
                            </div>
                          </div>
                        ) : (
                          "No Manager"
                        )}
                      </TableCell>
                      <TableCell>{store.category}</TableCell>
                      <TableCell>
                        {store.city}, {store.state}
                      </TableCell>
                      <TableCell>
                        {new Date(store?.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800"
                        >
                          UNDER REVIEW
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleStoreAction(store.id, "approve")
                            }
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleStoreAction(store.id, "reject")
                            }
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Applied Date</TableHead>
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
                      <TableCell>{manager.phoneNumber || "N/A"}</TableCell>
                      <TableCell>
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
            </CardContent>
          </Card>

          {/* Current Assignments */}
          <Card>
            <CardHeader>
              <CardTitle>Current Store Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Manager Email</TableHead>
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
                        <TableCell>{store.manager?.email || "N/A"}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
