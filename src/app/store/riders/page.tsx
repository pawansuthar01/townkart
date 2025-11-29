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
import { Search, UserPlus, Edit, Trash2, Star, Bike } from "lucide-react";

interface Rider {
  id: string;
  riderId: string;
  rider: {
    id: string;
    name: string;
    phone: string;
    email: string;
    vehicleType: string;
    rating: number;
    totalDeliveries: number;
    isVerified: boolean;
    isAvailable: boolean;
  };
  status: string;
  totalDeliveries: number;
  rating: number;
  isPreferred: boolean;
  commissionRate: number | null;
  assignedAt: string;
  assignedBy: string;
}

export default function StoreRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRiderPhone, setNewRiderPhone] = useState("");
  const [commissionRate, setCommissionRate] = useState("");

  useEffect(() => {
    fetchRiders();
  }, [statusFilter]);

  const fetchRiders = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const response = await fetch(`/api/store/riders?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRiders(data.riders);
        }
      }
    } catch (error) {
      console.error("Error fetching riders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch =
      rider.rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rider.rider.phone.includes(searchTerm) ||
      rider.rider.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PENDING":
        return "secondary";
      case "SUSPENDED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const updateRiderStatus = async (riderId: string, status: string) => {
    try {
      const response = await fetch(`/api/store/riders/${riderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchRiders(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating rider status:", error);
    }
  };

  const removeRider = async (riderId: string) => {
    if (
      !confirm("Are you sure you want to remove this rider from your store?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/store/riders/${riderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchRiders(); // Refresh the list
      }
    } catch (error) {
      console.error("Error removing rider:", error);
    }
  };

  const addRider = async () => {
    if (!newRiderPhone.trim()) {
      alert("Please enter a rider phone number");
      return;
    }

    try {
      const response = await fetch("/api/store/riders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: newRiderPhone,
          commissionRate: commissionRate ? parseFloat(commissionRate) : null,
        }),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setNewRiderPhone("");
        setCommissionRate("");
        fetchRiders(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add rider");
      }
    } catch (error) {
      console.error("Error adding rider:", error);
      alert("Failed to add rider");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Riders</h1>
          <p className="text-gray-600">Manage riders assigned to your store</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Rider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Rider</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Rider Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter rider's phone number"
                  value={newRiderPhone}
                  onChange={(e) => setNewRiderPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="commission">Commission Rate (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  placeholder="Optional commission rate"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              </div>
              <Button onClick={addRider} className="w-full">
                Add Rider
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Riders</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {riders.filter((r) => r.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approval
            </CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {riders.filter((r) => r.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Preferred Riders
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {riders.filter((r) => r.isPreferred).length}
            </div>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="REMOVED">Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Riders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Riders ({filteredRiders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Deliveries</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRiders.map((rider) => (
                <TableRow key={rider.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rider.rider.name}</div>
                      <div className="text-sm text-gray-500">
                        {rider.rider.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{rider.rider.phone}</TableCell>
                  <TableCell className="capitalize">
                    {rider.rider.vehicleType}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>{rider.rider.rating.toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{rider.totalDeliveries}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(rider.status)}>
                      {rider.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rider.commissionRate
                      ? `${rider.commissionRate}%`
                      : "Default"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {rider.status === "PENDING" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateRiderStatus(rider.riderId, "ACTIVE")
                          }
                        >
                          Approve
                        </Button>
                      )}
                      {rider.status === "ACTIVE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateRiderStatus(rider.riderId, "SUSPENDED")
                          }
                        >
                          Suspend
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRider(rider.riderId)}
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
    </div>
  );
}
