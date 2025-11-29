"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Phone, Edit, Save, X, Camera } from "lucide-react";

export default function CustomerProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  // Profile image
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
      setProfileImage(user.image || null);
    }
  }, [user]);

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
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      if (imageFile) {
        submitData.append("profileImage", imageFile);
      }

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        body: submitData,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      alert("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        fullName: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
      setProfileImage(user.image || null);
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">
                Manage your account information
              </p>
            </div>
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-max py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <Avatar className="w-24 h-24 mx-auto mb-4">
                      <AvatarImage src={profileImage || undefined} />
                      <AvatarFallback className="text-2xl">
                        {formData.fullName.charAt(0)?.toUpperCase() || "U"}
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
                    {formData.fullName || "User"}
                  </h2>

                  <Badge variant="secondary" className="mb-4">
                    Customer
                  </Badge>

                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{formData.email}</span>
                    </div>
                    {formData.phoneNumber && (
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{formData.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Account Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account status</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Change Password
                    </h3>
                    <p className="text-sm text-gray-600">
                      Update your account password
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Password
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security
                    </p>
                  </div>
                  <Badge variant="secondary">Not Enabled</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
