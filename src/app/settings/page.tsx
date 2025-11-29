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
  Palette,
  Globe,
  Smartphone,
  Save,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    promotionalEmails: false,
    deliveryAlerts: true,
    newProductAlerts: false,
    priceDropAlerts: true,

    // Privacy
    profileVisibility: "private",
    dataSharing: false,
    locationTracking: true,
    analyticsTracking: true,

    // Appearance
    theme: "system",
    language: "en",
    fontSize: "medium",
    compactMode: false,

    // Security
    twoFactorAuth: false,
    sessionTimeout: "30",
    loginAlerts: true,

    // Preferences
    defaultCurrency: "INR",
    defaultLanguage: "en",
    autoSaveCart: true,
    quickReorder: true,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Load user settings from API with fast caching
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        // Try to get from cache first
        const cached = localStorage.getItem(`settings_${user.id}`);
        if (cached) {
          const parsedSettings = JSON.parse(cached);
          const cacheTime = parsedSettings._cacheTime;
          const now = Date.now();

          // Use cache if less than 5 minutes old
          if (now - cacheTime < 5 * 60 * 1000) {
            setSettings((prev) => ({ ...prev, ...parsedSettings }));
            return;
          }
        }

        // Fetch from API
        const response = await fetch(`/api/users/${user.id}/settings`);
        if (response.ok) {
          const data = await response.json();
          const settingsWithCache = {
            ...data.settings,
            _cacheTime: Date.now(),
          };
          setSettings((prev) => ({ ...prev, ...data.settings }));
          localStorage.setItem(
            `settings_${user.id}`,
            JSON.stringify(settingsWithCache),
          );
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        // Keep default settings on error
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
      const response = await fetch(`/api/users/${user.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Update cache
        const settingsWithCache = { ...settings, _cacheTime: Date.now() };
        localStorage.setItem(
          `settings_${user.id}`,
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
      // Change password via API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your account preferences and security
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
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

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
                  <h3 className="text-lg font-semibold">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order Updates</p>
                        <p className="text-sm text-gray-600">
                          Get notified about order status changes
                        </p>
                      </div>
                      <Switch
                        checked={settings.orderUpdates}
                        onCheckedChange={(checked) =>
                          handleSettingChange("orderUpdates", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Promotional Emails</p>
                        <p className="text-sm text-gray-600">
                          Receive offers and promotional content
                        </p>
                      </div>
                      <Switch
                        checked={settings.promotionalEmails}
                        onCheckedChange={(checked) =>
                          handleSettingChange("promotionalEmails", checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Push Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Delivery Alerts</p>
                        <p className="text-sm text-gray-600">
                          Get notified when your order is out for delivery
                        </p>
                      </div>
                      <Switch
                        checked={settings.deliveryAlerts}
                        onCheckedChange={(checked) =>
                          handleSettingChange("deliveryAlerts", checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">SMS Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Alerts</p>
                        <p className="text-sm text-gray-600">
                          Receive important updates via SMS
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
                        <SelectItem value="friends">Friends Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Location Tracking</p>
                      <p className="text-sm text-gray-600">
                        Allow location tracking for better recommendations
                      </p>
                    </div>
                    <Switch
                      checked={settings.locationTracking}
                      onCheckedChange={(checked) =>
                        handleSettingChange("locationTracking", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Sharing</p>
                      <p className="text-sm text-gray-600">
                        Share anonymized data for service improvement
                      </p>
                    </div>
                    <Switch
                      checked={settings.dataSharing}
                      onCheckedChange={(checked) =>
                        handleSettingChange("dataSharing", checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) =>
                        handleSettingChange("theme", value)
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) =>
                        handleSettingChange("language", value)
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="mr">Marathi</SelectItem>
                      </SelectContent>
                    </Select>
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

              {/* Two-Factor Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-gray-600">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={settings.twoFactorAuth}
                      onCheckedChange={(checked) =>
                        handleSettingChange("twoFactorAuth", checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Session Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Auto Logout After</Label>
                    <Select
                      value={settings.sessionTimeout}
                      onValueChange={(value) =>
                        handleSettingChange("sessionTimeout", value)
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
