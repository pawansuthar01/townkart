"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  Mail,
  Phone,
  Edit,
  Save,
  X,
  Camera,
  Bike,
  MapPin,
  CreditCard,
} from "lucide-react";

export default function RiderProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [riderProfile, setRiderProfile] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    vehicleType: "",
    vehicleNumber: "",
    licenseNumber: "",
    emergencyContact: "",
    emergencyPhone: "",
    city: "",
  });

  // Profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchRiderProfile();
    }
  }, [isAuthenticated]);

  const fetchRiderProfile = async () => {
    try {
      const response = await fetch("/api/riders/profile");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRiderProfile(data.profile);
          setFormData({
            fullName: data.profile.user.fullName || "",
            email: data.profile.user.email || "",
            phoneNumber: data.profile.user.phoneNumber || "",
            vehicleType: data.profile.vehicleType || "",
            vehicleNumber: data.profile.vehicleNumber || "",
            licenseNumber: data.profile.licenseNumber || "",
            emergencyContact: data.profile.emergencyContact || "",
            emergencyPhone: data.profile.emergencyPhone || "",
            city: data.profile.city || "",
          });
          setProfileImage(data.profile.user.profileImageUrl || null);
        }
      }
    } catch (error) {
      console.error("Error fetching rider profile:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/riders/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
          licenseNumber: formData.licenseNumber,
          emergencyContact: formData.emergencyContact,
          emergencyPhone: formData.emergencyPhone,
          city: formData.city,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      alert("Profile updated successfully");
      setIsEditing(false);
      fetchRiderProfile(); // Refresh data
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (riderProfile) {
      setFormData({
        fullName: riderProfile.user.fullName || "",
        email: riderProfile.user.email || "",
        phoneNumber: riderProfile.user.phoneNumber || "",
        vehicleType: riderProfile.vehicleType || "",
        vehicleNumber: riderProfile.vehicleNumber || "",
        licenseNumber: riderProfile.licenseNumber || "",
        emergencyContact: riderProfile.emergencyContact || "",
        emergencyPhone: riderProfile.emergencyPhone || "",
        city: riderProfile.city || "",
      });
      setProfileImage(riderProfile.user.profileImageUrl || null);
    }
    setImageFile(null);
    setIsEditing(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please login to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile App Header Actions */}
      <div className="px-4 py-4 bg-white border-b">
        <div className="flex items-center justify-between">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Header Card */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="w-20 h-20 mx-auto">
                  <AvatarImage src={profileImage || undefined} />
                  <AvatarFallback className="text-xl">
                    {formData.fullName.charAt(0)?.toUpperCase() || "R"}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-townkart-primary text-white p-2 rounded-full cursor-pointer hover:bg-townkart-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {formData.fullName || "Rider"}
              </h2>

              <Badge variant="secondary" className="mb-4">
                Delivery Rider
              </Badge>

              <div className="flex justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{formData.email}</span>
                </div>
                {formData.phoneNumber && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{formData.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-2 px-3 bg-gray-50 rounded-md">
                      {formData.fullName || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <p className="text-gray-900 font-medium py-2 px-3 bg-gray-50 rounded-md">
                    {formData.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-2 px-3 bg-gray-50 rounded-md">
                      {formData.phoneNumber || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  {isEditing ? (
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) =>
                        handleInputChange("emergencyContact", e.target.value)
                      }
                      placeholder="Enter emergency contact"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-2 px-3 bg-gray-50 rounded-md">
                      {formData.emergencyContact || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bike className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle Type</Label>
                  {isEditing ? (
                    <select
                      id="vehicleType"
                      value={formData.vehicleType}
                      onChange={(e) =>
                        handleInputChange("vehicleType", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-townkart-primary focus:border-transparent"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="bicycle">Bicycle</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="scooter">Scooter</option>
                      <option value="car">Car</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 font-medium py-2 px-3 bg-gray-50 rounded-md capitalize">
                      {formData.vehicleType || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                  {isEditing ? (
                    <Input
                      id="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={(e) =>
                        handleInputChange("vehicleNumber", e.target.value)
                      }
                      placeholder="Enter vehicle number"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-2 px-3 bg-gray-50 rounded-md uppercase">
                      {formData.vehicleNumber || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="licenseNumber">Driving License Number</Label>
                  {isEditing ? (
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        handleInputChange("licenseNumber", e.target.value)
                      }
                      placeholder="Enter driving license number"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-2 px-3 bg-gray-50 rounded-md uppercase">
                      {formData.licenseNumber || "Not provided"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Working Hours</h3>
                  <p className="text-sm text-gray-600">Set your availability</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Service Areas</h3>
                  <p className="text-sm text-gray-600">Manage delivery zones</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Payment Methods</h3>
                  <p className="text-sm text-gray-600">Bank account details</p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
