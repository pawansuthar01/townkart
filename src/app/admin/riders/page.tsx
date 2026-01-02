"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bike,
  Plus,
  Eye,
  Edit,
  Star,
  MapPin,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Rider {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  totalDeliveries: number;
  earnings: number;
  status: string;
  location: string;
  vehicle: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface PendingRider {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  appliedDate: string;
  documents: string[];
}

interface RiderStats {
  totalRiders: number;
  activeRiders: number;
  totalDeliveries: number;
  totalEarnings: number;
}

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [pendingRiders, setPendingRiders] = useState<PendingRider[]>([]);
  const [stats, setStats] = useState<RiderStats>({
    totalRiders: 0,
    activeRiders: 0,
    totalDeliveries: 0,
    totalEarnings: 0,
  });
  const [selectedRider, setSelectedRider] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const response = await fetch("/api/admin/riders");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRiders(data.riders);
          setPendingRiders(data.pendingApplications);
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error("Error fetching riders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRider = async (riderId: string) => {
    try {
      const response = await fetch("/api/admin/riders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ riderId, action: "approve" }),
      });

      if (response.ok) {
        fetchRiders(); // Refresh data
      }
    } catch (error) {
      console.error("Error approving rider:", error);
    }
  };

  const handleRejectRider = async (riderId: string) => {
    try {
      const response = await fetch("/api/admin/riders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ riderId, action: "reject" }),
      });

      if (response.ok) {
        fetchRiders(); // Refresh data
      }
    } catch (error) {
      console.error("Error rejecting rider:", error);
    }
  };

  const handleSuspendRider = async (riderId: string) => {
    try {
      const response = await fetch("/api/admin/riders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ riderId, action: "suspend" }),
      });

      if (response.ok) {
        fetchRiders(); // Refresh data
      }
    } catch (error) {
      console.error("Error suspending rider:", error);
    }
  };

  const handleActivateRider = async (riderId: string) => {
    try {
      const response = await fetch("/api/admin/riders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ riderId, action: "activate" }),
      });

      if (response.ok) {
        fetchRiders(); // Refresh data
      }
    } catch (error) {
      console.error("Error activating rider:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rider Management</h1>
          <p className="text-gray-600">
            Manage delivery riders and applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchRiders} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Rider
          </Button>
        </div>
      </div>

      <Tabs defaultValue="riders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="riders">
            Active Riders ({stats.totalRiders})
          </TabsTrigger>
          <TabsTrigger value="applications">
            Applications ({pendingRiders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="riders" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Riders
                </CardTitle>
                <Bike className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRiders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Riders
                </CardTitle>
                <Bike className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeRiders}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Deliveries
                </CardTitle>
                <Bike className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalDeliveries}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <Bike className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{stats.totalEarnings.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Riders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Riders ({stats.totalRiders})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rider Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Rating
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Deliveries
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Earnings
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Location
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Vehicle
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riders.map((rider) => (
                      <TableRow key={rider.id}>
                        <TableCell className="font-medium">
                          {rider.name}
                        </TableCell>
                        <TableCell>{rider.phone}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {rider.rating}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {rider.totalDeliveries}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          ₹{rider.earnings.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              rider.status === "AVAILABLE"
                                ? "default"
                                : rider.status === "BUSY"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {rider.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {rider.location}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {rider.vehicle}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {rider.isActive ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSuspendRider(rider.userId)}
                                className="text-yellow-600 hover:text-yellow-700"
                              >
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleActivateRider(rider.userId)
                                }
                                className="text-green-600 hover:text-green-700"
                              >
                                Activate
                              </Button>
                            )}
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

        <TabsContent value="applications" className="space-y-6">
          {/* Pending Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Rider Applications ({pendingRiders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Applied Date
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Documents
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRiders.map((rider) => (
                      <TableRow key={rider.id}>
                        <TableCell className="font-medium">
                          {rider.name}
                        </TableCell>
                        <TableCell>{rider.email}</TableCell>
                        <TableCell>{rider.phone}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {new Date(rider.appliedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {rider.documents.map((doc, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {rider.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveRider(rider.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectRider(rider.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="h-4 w-4" />
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

          {/* Rider Management Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Rider Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Select Rider</label>
                  <Select
                    value={selectedRider}
                    onValueChange={setSelectedRider}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose rider" />
                    </SelectTrigger>
                    <SelectContent>
                      {riders.map((rider) => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.name} ({rider.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      selectedRider && handleSuspendRider(selectedRider)
                    }
                    disabled={!selectedRider}
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    Suspend Rider
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      selectedRider && handleActivateRider(selectedRider)
                    }
                    disabled={!selectedRider}
                    className="text-green-600 hover:text-green-700"
                  >
                    Re-activate
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
