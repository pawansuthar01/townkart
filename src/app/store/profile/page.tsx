"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Star,
  ShoppingCart,
  DollarSign,
  Edit,
} from "lucide-react";

interface StoreProfile {
  id: string;
  name: string;
  code: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  category: string;
  subcategory: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  operatingHours: any;
  serviceArea: any;
  manager: {
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
  };
  performance: {
    averageRating: number;
    totalOrders: number;
    totalRevenue: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function StoreProfilePage() {
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/store/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.profile);
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/store/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          description: profile.description,
          address: profile.address,
          phoneNumber: profile.phoneNumber,
          email: profile.email,
          operatingHours: profile.operatingHours,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        fetchProfile(); // Refresh data
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load store profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Profile</h1>
          <p className="text-gray-600">Manage your store information</p>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "outline" : "default"}
        >
          <Edit className="mr-2 h-4 w-4" />
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      {/* Store Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Store Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Store Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              ) : (
                <p className="text-lg font-medium">{profile.name}</p>
              )}
            </div>
            <div>
              <Label>Store Code</Label>
              <p className="text-lg font-medium">{profile.code}</p>
            </div>
            <div>
              <Label>Category</Label>
              <p>{profile.category}</p>
            </div>
            <div>
              <Label>Status</Label>
              <div className="flex gap-2">
                <Badge variant={profile.isActive ? "default" : "secondary"}>
                  {profile.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={profile.isVerified ? "default" : "outline"}>
                  {profile.isVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                value={profile.description}
                onChange={(e) =>
                  setProfile({ ...profile, description: e.target.value })
                }
                rows={3}
              />
            ) : (
              <p>{profile.description || "No description provided"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={profile.phoneNumber}
                  onChange={(e) =>
                    setProfile({ ...profile, phoneNumber: e.target.value })
                  }
                />
              ) : (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {profile.phoneNumber}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile({ ...profile, email: e.target.value })
                  }
                />
              ) : (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            {isEditing ? (
              <Textarea
                id="address"
                value={profile.address}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
                rows={3}
              />
            ) : (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {profile.address}, {profile.city}, {profile.state} -{" "}
                {profile.pincode}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manager Information */}
      <Card>
        <CardHeader>
          <CardTitle>Store Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <p>{profile.manager.name}</p>
            </div>
            <div>
              <Label>Phone</Label>
              <p>{profile.manager.phoneNumber}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p>{profile.manager.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">
                  {profile.performance.averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">
                  {profile.performance.totalOrders}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">
                  ₹{profile.performance.totalRevenue.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {isEditing && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}
