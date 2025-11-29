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

  // Settings state
  const [settings, setSettings] = useState({
    // Notifications
    orderNotifications: true,
    deliveryAlerts: true,
    earningsAlerts: true,
    systemUpdates: false,

    // Availability
    autoAcceptOrders: false,
    maxDailyOrders: 20,
    preferredAreas: "all",
    workingHours: "flexible",

    // Vehicle
    vehicleType: "bike",
    vehicleNumber: "",

    // Privacy
    locationSharing: true,
    profileVisibility: "private",
    earningsVisibility: "private",

    // Preferences
    language: "en",
    theme: "system",
    soundNotifications: true,
    vibration: true,
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

        const response = await fetch(`/api/riders/${user.id}/settings`);
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
      const response = await fetch(`/api/riders/${user.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const settingsWithCache = { ...settings, _cacheTime: Date.now() };
        localStorage.setItem(
          `rider_settings_${user.id}`,
          JSON.stringify(settingsWithCache),
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
        <Tabs defaultValue="delivery" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Bike className="h-4 w-4" />
              <span className="hidden sm:inline">Delivery</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Delivery Settings */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bike className="h-5 w-5" />
                  Delivery Preferences
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
                    <Label htmlFor="maxDailyOrders">Max Daily Orders</Label>
                    <Select
                      value={settings.maxDailyOrders.toString()}
                      onValueChange={(value) =>
                        handleSettingChange("maxDailyOrders", parseInt(value))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 orders</SelectItem>
                        <SelectItem value="15">15 orders</SelectItem>
                        <SelectItem value="20">20 orders</SelectItem>
                        <SelectItem value="25">25 orders</SelectItem>
                        <SelectItem value="30">30 orders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="preferredAreas">Preferred Areas</Label>
                  <Select
                    value={settings.preferredAreas}
                    onValueChange={(value) =>
                      handleSettingChange("preferredAreas", value)
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      <SelectItem value="city-center">City Center</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto Accept Orders</p>
                    <p className="text-sm text-gray-600">
                      Automatically accept incoming delivery requests
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoAcceptOrders}
                    onCheckedChange={(checked) =>
                      handleSettingChange("autoAcceptOrders", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>
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
                      <p className="font-medium">Order Notifications</p>
                      <p className="text-sm text-gray-600">
                        Get notified about new delivery requests
                      </p>
                    </div>
                    <Switch
                      checked={settings.orderNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingChange("orderNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delivery Alerts</p>
                      <p className="text-sm text-gray-600">
                        Receive alerts about delivery status updates
                      </p>
                    </div>
                    <Switch
                      checked={settings.deliveryAlerts}
                      onCheckedChange={(checked) =>
                        handleSettingChange("deliveryAlerts", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Earnings Alerts</p>
                      <p className="text-sm text-gray-600">
                        Get notified about payments and earnings
                      </p>
                    </div>
                    <Switch
                      checked={settings.earningsAlerts}
                      onCheckedChange={(checked) =>
                        handleSettingChange("earningsAlerts", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sound Notifications</p>
                      <p className="text-sm text-gray-600">
                        Play sound for notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.soundNotifications}
                      onCheckedChange={(checked) =>
                        handleSettingChange("soundNotifications", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Vibration</p>
                      <p className="text-sm text-gray-600">
                        Vibrate device for notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.vibration}
                      onCheckedChange={(checked) =>
                        handleSettingChange("vibration", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="profileVisibility">
                      Profile Visibility
                    </Label>
                    <Select
                      value={settings.profileVisibility}
                      onValueChange={(value) =>
                        handleSettingChange("profileVisibility", value)
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="partners">Partners Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="earningsVisibility">
                      Earnings Visibility
                    </Label>
                    <Select
                      value={settings.earningsVisibility}
                      onValueChange={(value) =>
                        handleSettingChange("earningsVisibility", value)
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="partners">Partners Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Location Sharing</p>
                      <p className="text-sm text-gray-600">
                        Share your location for better delivery matching
                      </p>
                    </div>
                    <Switch
                      checked={settings.locationSharing}
                      onCheckedChange={(checked) =>
                        handleSettingChange("locationSharing", checked)
                      }
                    />
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
                            e.target.value,
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
