"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Home,
  Briefcase,
  MoreHorizontal,
  Check,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Address {
  id: string;
  type: "home" | "work" | "other";
  name: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function CustomerAddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: "home" as "home" | "work" | "other",
    name: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/users/addresses");
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  // Reset form
  const resetForm = () => {
    setFormData({
      type: "home",
      name: "",
      line1: "",
      line2: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
    });
    setEditingAddress(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingAddress
        ? `/api/users/addresses/${editingAddress.id}`
        : "/api/users/addresses";

      const method = editingAddress ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAddresses();
        setShowAddDialog(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      type: address.type,
      name: address.name,
      line1: address.line1,
      line2: address.line2 || "",
      landmark: address.landmark || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });
    setShowAddDialog(true);
  };

  // Handle delete
  const handleDelete = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const response = await fetch(`/api/users/addresses/${addressId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAddresses();
      } else {
        alert("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      alert("Failed to delete address");
    }
  };

  // Handle set as default
  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/users/addresses/${addressId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        await fetchAddresses();
      } else {
        alert("Failed to set default address");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      alert("Failed to set default address");
    }
  };

  const getAddressIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="h-5 w-5" />;
      case "work":
        return <Briefcase className="h-5 w-5" />;
      default:
        return <MoreHorizontal className="h-5 w-5" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please login to manage your addresses
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-townkart-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
              <p className="text-gray-600 mt-1">
                Manage your delivery addresses
              </p>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm();
                    setShowAddDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddress ? "Edit Address" : "Add New Address"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Address Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: "home" | "work" | "other") =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="home">Home</SelectItem>
                          <SelectItem value="work">Work</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Address Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Home, Office"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="line1">Address Line 1 *</Label>
                    <Input
                      id="line1"
                      value={formData.line1}
                      onChange={(e) =>
                        setFormData({ ...formData, line1: e.target.value })
                      }
                      placeholder="Street address, building name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="line2">Address Line 2</Label>
                    <Input
                      id="line2"
                      value={formData.line2}
                      onChange={(e) =>
                        setFormData({ ...formData, line2: e.target.value })
                      }
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      value={formData.landmark}
                      onChange={(e) =>
                        setFormData({ ...formData, landmark: e.target.value })
                      }
                      placeholder="Nearby landmark"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                      placeholder="6-digit pincode"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {editingAddress ? "Update" : "Add"} Address
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Addresses List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No addresses found
              </h3>
              <p className="text-gray-600 mb-6">
                Add your first delivery address to get started
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="townkart-gradient"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-townkart-primary/10 rounded-lg">
                        {getAddressIcon(address.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {address.name}
                          </h3>
                          {address.isDefault && (
                            <Badge className="bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          <Badge variant="outline" className="capitalize">
                            {address.type}
                          </Badge>
                        </div>
                        <div className="text-gray-600 space-y-1">
                          <p>{address.line1}</p>
                          {address.line2 && <p>{address.line2}</p>}
                          {address.landmark && (
                            <p>Landmark: {address.landmark}</p>
                          )}
                          <p>
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {!address.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(address.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
