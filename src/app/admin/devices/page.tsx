"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Battery,
  Clock,
  Shield,
  AlertTriangle,
  Power,
  Search,
  Filter,
} from "lucide-react";

interface Device {
  id: string;
  deviceId: string;
  deviceName: string | null;
  deviceType: string;
  os: string | null;
  browser: string | null;
  lastLoginAt: string;
  lastIP: string;
  lastLocation: any;
  batteryLevel: number | null;
  loginCount: number;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string;
    userRoles: string[];
    activeRole: string;
    lastLoginAt: string;
    isActive: boolean;
  };
  _count: {
    loginLogs: number;
  };
}

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [onlineFilter, setOnlineFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchDevices = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (onlineFilter !== "all") params.set("online", onlineFilter);

      const response = await fetch(`/api/admin/devices?${params}`);
      const data = await response.json();

      if (data.success) {
        setDevices(data.data.devices);
        setPagination(data.data.pagination);
      } else {
        alert(data.message || "Failed to fetch devices");
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      alert("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [searchQuery, roleFilter, onlineFilter]);

  const handleForceLogout = async (deviceId: string, userId: string) => {
    try {
      const response = await fetch("/api/admin/devices", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId, userId }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Device logged out successfully");
        fetchDevices(pagination.page);
      } else {
        alert(data.message || "Failed to logout device");
      }
    } catch (error) {
      console.error("Error logging out device:", error);
      alert("Failed to logout device");
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatLocation = (location: any) => {
    if (!location) return "Unknown";
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    return parts.join(", ") || "Unknown";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Device Management
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage user device logins across the platform
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="CUSTOMER">Customer</SelectItem>
                <SelectItem value="RIDER">Rider</SelectItem>
                <SelectItem value="STORE_MANAGER">Store Manager</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Select value={onlineFilter} onValueChange={setOnlineFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Online status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="true">Online Only</SelectItem>
                <SelectItem value="false">Offline Only</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("all");
                setOnlineFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Devices
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {pagination.total}
                </p>
              </div>
              <Monitor className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Online Devices
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {devices.filter((d) => d.isActive).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-3 w-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Mobile Devices
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {devices.filter((d) => d.deviceType === "mobile").length}
                </p>
              </div>
              <Smartphone className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Suspicious Logins
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {devices.filter((d) => d._count.loginLogs > 10).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Device Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading devices...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-12">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No devices found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search criteria
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Device
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Location
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Last Login
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {device.user.fullName || device.user.phoneNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            {device.user.email}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {device.user.activeRole}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(device.deviceType)}
                          <div>
                            <p className="font-medium">
                              {device.deviceName ||
                                `${device.deviceType} device`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {device.os} • {device.browser}
                            </p>
                            {device.batteryLevel && (
                              <div className="flex items-center gap-1 mt-1">
                                <Battery className="h-3 w-3" />
                                <span className="text-xs text-gray-600">
                                  {device.batteryLevel}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {formatLocation(device.lastLocation)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {device.lastIP}
                        </p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {formatDate(device.lastLoginAt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {device.loginCount} logins
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={device.isActive ? "default" : "secondary"}
                          className={
                            device.isActive ? "bg-green-100 text-green-800" : ""
                          }
                        >
                          {device.isActive ? "Online" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {device.isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleForceLogout(device.deviceId, device.user.id)
                            }
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Power className="h-4 w-4 mr-1" />
                            Logout
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} devices
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => fetchDevices(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => fetchDevices(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
