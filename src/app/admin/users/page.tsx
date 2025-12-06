"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Filter, Edit, LogOut, Eye } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roles: string[];
  status: string;
  joinDate: string;
  lastLogin: string;
  isLoggedIn: boolean;
  devices: Array<{
    id: string;
    deviceId: string | null;
    deviceName: string;
    deviceType: string;
    os: string | null;
    browser: string | null;
    ipAddress: string;
    lastActivity: string;
    location: any;
  }>;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState({
    status: "ACTIVE",
    role: "CUSTOMER",
  });
  const [updating, setUpdating] = useState(false);
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [showServiceAreaDialog, setShowServiceAreaDialog] = useState(false);
  const [stores, setStores] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);
  const [serviceAreas, setServiceAreas] = useState<
    Array<{ id: string; name: string; city: string }>
  >([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedServiceAreaId, setSelectedServiceAreaId] =
    useState<string>("");
  const [userAnalytics, setUserAnalytics] = useState<{
    userGrowth: Array<{ month: string; users: number }>;
    roleDistribution: Array<{ role: string; count: number; color: string }>;
    statusDistribution: Array<{ status: string; count: number; color: string }>;
  } | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: "",
    phone: "",
    role: "RIDER" as "RIDER" | "STORE_MANAGER",
    storeId: "",
    serviceAreaId: "",
  });
  const [userRoleData, setUserRoleData] = useState<{
    riderInfo?: {
      serviceArea: { id: string; name: string; city: string };
      store?: { id: string; name: string; code: string };
    };
    storeManagerInfo?: {
      store: { id: string; name: string; code: string };
    };
  } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to fetch users");
      }
    } catch (err) {
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/users/analytics");
      const result = await response.json();
      if (result.success) {
        setUserAnalytics(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch user analytics:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUserAnalytics();
  }, []);

  const filteredUsers = data?.users || [];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "STORE_MANAGER":
        return "default";
      case "RIDER":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "ACTIVE" ? "default" : "secondary";
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      status: user.status,
      role: user.role,
    });
    setShowEditDialog(true);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    // Check if role is being changed
    if (editUser.role !== selectedUser.role) {
      if (editUser.role === "STORE_MANAGER") {
        // Load stores and show store selection dialog
        await loadStores();
        setShowEditDialog(false);
        setShowStoreDialog(true);
        return;
      } else if (editUser.role === "RIDER") {
        // Load service areas and show service area selection dialog
        await loadServiceAreas();
        setShowEditDialog(false);
        setShowServiceAreaDialog(true);
        return;
      }
    }

    // For same role or other changes, proceed normally
    await updateUser(editUser);
  };

  const loadStores = async () => {
    try {
      const response = await fetch("/api/admin/stores?limit=100");
      const result = await response.json();
      if (result.success) {
        setStores(
          result.data.stores.map((store: any) => ({
            id: store.id,
            name: store.name,
            code: store.code,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load stores:", error);
    }
  };

  const loadServiceAreas = async () => {
    try {
      const response = await fetch("/api/admin/service-areas");
      const result = await response.json();
      if (result.success) {
        setServiceAreas(result.data);
      }
    } catch (error) {
      console.error("Failed to load service areas:", error);
    }
  };

  const handleStoreAssignment = async () => {
    if (!selectedStoreId || !selectedUser) return;

    await updateUser({
      ...editUser,
      storeId: selectedStoreId,
    });

    setShowStoreDialog(false);
    setSelectedStoreId("");
  };

  const handleServiceAreaAssignment = async () => {
    if (!selectedServiceAreaId || !selectedUser) return;

    await updateUser({
      ...editUser,
      serviceAreaId: selectedServiceAreaId,
    });

    setShowServiceAreaDialog(false);
    setSelectedServiceAreaId("");
  };

  const updateUser = async (userData: any) => {
    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();

        // Update the specific user in the local state instead of refetching all
        setData((prevData) => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            users: prevData.users.map((user) =>
              user.id === selectedUser!.id
                ? {
                    ...user,
                    role: result.user.role,
                    status: result.user.status,
                    // Update login status if role change might affect it
                    isLoggedIn: user.isLoggedIn, // Keep existing login status
                    devices: user.devices, // Keep existing devices
                  }
                : user
            ),
          };
        });

        setShowEditDialog(false);
        setSelectedUser(null);
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    } finally {
      setUpdating(false);
    }
  };

  const getRoleRequirements = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "• Full system access\n• User management permissions\n• System configuration access\n• Security clearance";
      case "STORE_MANAGER":
        return "• Store ownership verification\n• Business license\n• Address verification\n• Product management training";
      case "RIDER":
        return "• Valid driver's license\n• Vehicle registration\n• Background check\n• Delivery training";
      case "CUSTOMER":
        return "• Email verification\n• Phone verification\n• Basic account setup";
      default:
        return "• Standard user requirements";
    }
  };

  const handleLogoutUser = async (userId: string) => {
    if (!confirm("Are you sure you want to logout this user?")) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/logout`, {
        method: "POST",
      });

      if (response.ok) {
        alert("User logged out successfully");
        fetchUsers();
      } else {
        const error = await response.json();
        alert(error.message || "Failed to logout user");
      }
    } catch (error) {
      console.error("Error logging out user:", error);
      alert("Failed to logout user");
    }
  };

  const TableSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  );

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="text-gray-600">Manage all users on the platform</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchUsers()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all users on the platform</p>
        </div>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage User: {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editUser.status}
                  onValueChange={(value) =>
                    setEditUser({ ...editUser, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editUser.role}
                  onValueChange={(value) =>
                    setEditUser({ ...editUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="STORE_MANAGER">Store Manager</SelectItem>
                    <SelectItem value="RIDER">Rider</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleLogoutUser(selectedUser!.id)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  Logout User
                </Button>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateUser} disabled={updating}>
                    {updating ? "Updating..." : "Update User"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details: {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      User ID
                    </Label>
                    <p className="font-mono text-sm">{selectedUser.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Full Name
                    </Label>
                    <p>{selectedUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Email
                    </Label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Phone
                    </Label>
                    <p>{selectedUser.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Role
                    </Label>
                    <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                      {selectedUser.role.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <Badge variant={getStatusBadgeVariant(selectedUser.status)}>
                      {selectedUser.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Join Date
                    </Label>
                    <p>{selectedUser.joinDate}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Last Login
                    </Label>
                    <p>{selectedUser.lastLogin}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Role Requirements</h4>
                  <p className="text-sm text-gray-600">
                    {getRoleRequirements(selectedUser.role)}
                  </p>
                </div>
                {selectedUser.devices.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">
                      Active Devices ({selectedUser.devices.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedUser.devices.map((device) => (
                        <div
                          key={device.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">
                                {device.deviceName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {device.deviceType} • {device.os} •{" "}
                                {device.browser}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Online
                            </Badge>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <p>IP: {device.ipAddress}</p>
                            <p>
                              Last Activity:{" "}
                              {new Date(device.lastActivity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Store Manager Role</DialogTitle>
              <p className="text-sm text-gray-600">
                Select a store to assign to {selectedUser?.name} as a store
                manager.
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="store-select">Select Store</Label>
                <Select
                  value={selectedStoreId}
                  onValueChange={setSelectedStoreId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a store..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowStoreDialog(false);
                    setSelectedStoreId("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStoreAssignment}
                  disabled={!selectedStoreId || updating}
                >
                  {updating ? "Assigning..." : "Assign Store Manager"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showServiceAreaDialog}
          onOpenChange={setShowServiceAreaDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Rider Role</DialogTitle>
              <p className="text-sm text-gray-600">
                Select a service area to assign to {selectedUser?.name} as a
                rider.
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="service-area-select">Select Service Area</Label>
                <Select
                  value={selectedServiceAreaId}
                  onValueChange={setSelectedServiceAreaId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a service area..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name} - {area.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowServiceAreaDialog(false);
                    setSelectedServiceAreaId("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleServiceAreaAssignment}
                  disabled={!selectedServiceAreaId || updating}
                >
                  {updating ? "Assigning..." : "Assign Rider"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Analytics Charts */}
      {userAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={userAnalytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={userAnalytics.roleDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ role, count }) => `${role}: ${count}`}
                  >
                    {userAnalytics.roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={userAnalytics.statusDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count">
                    {userAnalytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by ID, name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="STORE_MANAGER">Store Manager</SelectItem>
                <SelectItem value="RIDER">Rider</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({data ? data.pagination.total : 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Login Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">
                      {user.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.status)}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isLoggedIn ? "default" : "secondary"}
                      >
                        {user.isLoggedIn ? "Online" : "Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.joinDate}</TableCell>
                    <TableCell>{user.lastLogin}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title="Edit Status & Role"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user.isLoggedIn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLogoutUser(user.id)}
                            title="Logout User"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * 20 + 1} to{" "}
            {Math.min(currentPage * 20, data.pagination.total)} of{" "}
            {data.pagination.total} users
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === data.pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
