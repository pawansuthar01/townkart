"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  Settings,
  Bell,
  Shield,
  Bike,
  MapPin,
  Clock,
  Save,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function RiderSettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Settings state - matches API response structure
  const [settings, setSettings] = useState({
    // Notifications (from user preferences)
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,

    // Rider Profile Settings
    vehicleType: "bike",
    vehicleNumber: "",
    licenseNumber: "",
    emergencyContact: "",
    emergencyPhone: "",
    city: "",
    isAvailable: false,
    maxDailyDeliveries: 20,
    preferredZones: null,
    skills: null,
    availabilitySchedule: null,

    // Status Information (read-only)
    isVerified: false,
    isActive: true,
    suspensionReason: null,
    suspendedUntil: null,

    // Performance Metrics (read-only)
    rating: 0,
    totalDeliveries: 0,
    totalEarnings: 0,
    onTimeDeliveryRate: 0,
    averageDeliveryTime: 0,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Load user settings from API
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        const cached = localStorage.getItem(`rider_settings_${user.id}`);
        if (cached) {
          const parsedSettings = JSON.parse(cached);
          const cacheTime = parsedSettings._cacheTime;
          const now = Date.now();

          if (now - cacheTime < 5 * 60 * 1000) {
            setSettings((prev) => ({ ...prev, ...parsedSettings }));
            return;
          }
        }

        const response = await fetch(`/api/riders/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      } catch (error) {
        console.error("Failed to load rider settings:", error);
      }
    };

    loadSettings();
  }, [user?.id]);

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/riders/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const settingsWithCache = { ...settings, _cacheTime: Date.now() };
        localStorage.setItem(
          `rider_settings_${user.id}`,
          JSON.stringify(settingsWithCache)
        );
        alert("Settings saved successfully!");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      alert("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">Please login to access settings</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-max py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Rider Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your delivery preferences and account settings
              </p>
            </div>
            <Button onClick={handleSaveSettings} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="container-max py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Bike className="h-4 w-4" />
              <span className="hidden sm:inline">Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <div className="space-y-6">
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
                    <div>
                      <Label htmlFor="vehicleType">Vehicle Type</Label>
                      <Select
                        value={settings.vehicleType}
                        onValueChange={(value) =>
                          handleSettingChange("vehicleType", value)
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bike">Bike</SelectItem>
                          <SelectItem value="scooter">Scooter</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                      <Input
                        id="vehicleNumber"
                        value={settings.vehicleNumber || ""}
                        onChange={(e) =>
                          handleSettingChange("vehicleNumber", e.target.value)
                        }
                        placeholder="Enter vehicle number"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={settings.licenseNumber || ""}
                        onChange={(e) =>
                          handleSettingChange("licenseNumber", e.target.value)
                        }
                        placeholder="Enter license number"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">Operating City</Label>
                      <Input
                        id="city"
                        value={settings.city || ""}
                        onChange={(e) =>
                          handleSettingChange("city", e.target.value)
                        }
                        placeholder="Enter operating city"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="emergencyContact">
                        Emergency Contact Name
                      </Label>
                      <Input
                        id="emergencyContact"
                        value={settings.emergencyContact || ""}
                        onChange={(e) =>
                          handleSettingChange(
                            "emergencyContact",
                            e.target.value
                          )
                        }
                        placeholder="Enter emergency contact name"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergencyPhone">
                        Emergency Contact Phone
                      </Label>
                      <Input
                        id="emergencyPhone"
                        value={settings.emergencyPhone || ""}
                        onChange={(e) =>
                          handleSettingChange("emergencyPhone", e.target.value)
                        }
                        placeholder="Enter emergency contact phone"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Availability Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="maxDailyDeliveries">
                        Max Daily Deliveries
                      </Label>
                      <Select
                        value={settings.maxDailyDeliveries.toString()}
                        onValueChange={(value) =>
                          handleSettingChange(
                            "maxDailyDeliveries",
                            parseInt(value)
                          )
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 deliveries</SelectItem>
                          <SelectItem value="15">15 deliveries</SelectItem>
                          <SelectItem value="20">20 deliveries</SelectItem>
                          <SelectItem value="25">25 deliveries</SelectItem>
                          <SelectItem value="30">30 deliveries</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Available for Deliveries</p>
                        <p className="text-sm text-gray-600">
                          Set your availability status
                        </p>
                      </div>
                      <Switch
                        checked={settings.isAvailable}
                        onCheckedChange={(checked) =>
                          handleSettingChange("isAvailable", checked)
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-600">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingChange("emailNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-gray-600">
                        Receive push notifications on your device
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingChange("pushNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-gray-600">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingChange("smsNotifications", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bike className="h-5 w-5" />
                  Delivery Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maxDailyDeliveries">
                      Maximum Daily Deliveries
                    </Label>
                    <Select
                      value={settings.maxDailyDeliveries.toString()}
                      onValueChange={(value) =>
                        handleSettingChange(
                          "maxDailyDeliveries",
                          parseInt(value)
                        )
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 deliveries</SelectItem>
                        <SelectItem value="15">15 deliveries</SelectItem>
                        <SelectItem value="20">20 deliveries</SelectItem>
                        <SelectItem value="25">25 deliveries</SelectItem>
                        <SelectItem value="30">30 deliveries</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Available for Deliveries</p>
                      <p className="text-sm text-gray-600">
                        Set your availability to receive delivery requests
                      </p>
                    </div>
                    <Switch
                      checked={settings.isAvailable}
                      onCheckedChange={(checked) =>
                        handleSettingChange("isAvailable", checked)
                      }
                    />
                  </div>

                  {/* Performance Metrics (Read-only) */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Performance Overview
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Total Deliveries</p>
                        <p className="font-semibold text-gray-900">
                          {settings.totalDeliveries}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Rating</p>
                        <p className="font-semibold text-gray-900">
                          {settings.rating}/5.0
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">On-Time Rate</p>
                        <p className="font-semibold text-gray-900">
                          {settings.onTimeDeliveryRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Delivery Time</p>
                        <p className="font-semibold text-gray-900">
                          {settings.averageDeliveryTime}min
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative mt-2">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          handlePasswordChange(
                            "currentPassword",
                            e.target.value
                          )
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative mt-2">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          handlePasswordChange("newPassword", e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordChange("confirmPassword", e.target.value)
                      }
                      className="mt-2"
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Change Password
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
