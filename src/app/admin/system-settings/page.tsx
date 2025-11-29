"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Database,
  Shield,
  Truck,
  CreditCard,
  Users,
  Bell,
  Palette,
  Globe,
  Smartphone,
  Mail,
  Lock,
} from "lucide-react";

interface SystemSettings {
  [category: string]: {
    [key: string]: any;
  };
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SystemSettings>({});

  // Load system settings
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/system-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
        setOriginalSettings(JSON.parse(JSON.stringify(data.data))); // Deep copy
      }
    } catch (error) {
      console.error("Failed to load system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Check for changes
  useEffect(() => {
    const hasChanged =
      JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(hasChanged);
  }, [settings, originalSettings]);

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Prepare bulk updates
      const updates: Array<{ category: string; key: string; value: any }> = [];

      Object.entries(settings).forEach(([category, categorySettings]) => {
        Object.entries(categorySettings).forEach(([key, value]) => {
          const originalValue = originalSettings[category]?.[key];
          if (JSON.stringify(value) !== JSON.stringify(originalValue)) {
            updates.push({ category, key, value });
          }
        });
      });

      if (updates.length === 0) {
        alert("No changes to save");
        return;
      }

      const response = await fetch("/api/admin/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });

      if (response.ok) {
        alert("Settings saved successfully!");
        setOriginalSettings(JSON.parse(JSON.stringify(settings)));
        setHasChanges(false);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading system settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage platform-wide settings and configurations
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={resetSettings}
            disabled={!hasChanges}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || saving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              You have unsaved changes
            </span>
          </div>
        </div>
      )}

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Platform</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Delivery</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Features</span>
          </TabsTrigger>
        </TabsList>

        {/* Platform Settings */}
        <TabsContent value="platform">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Platform Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name</Label>
                    <Input
                      id="platformName"
                      value={settings.platform?.platformName || ""}
                      onChange={(e) =>
                        updateSetting(
                          "platform",
                          "platformName",
                          e.target.value,
                        )
                      }
                      placeholder="TownKart"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platformVersion">Platform Version</Label>
                    <Input
                      id="platformVersion"
                      value={settings.platform?.platformVersion || ""}
                      onChange={(e) =>
                        updateSetting(
                          "platform",
                          "platformVersion",
                          e.target.value,
                        )
                      }
                      placeholder="1.0.0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformDescription">
                    Platform Description
                  </Label>
                  <Textarea
                    id="platformDescription"
                    value={settings.platform?.platformDescription || ""}
                    onChange={(e) =>
                      updateSetting(
                        "platform",
                        "platformDescription",
                        e.target.value,
                      )
                    }
                    rows={3}
                    placeholder="Your local marketplace for fresh groceries and daily essentials"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.platform?.supportEmail || ""}
                      onChange={(e) =>
                        updateSetting(
                          "platform",
                          "supportEmail",
                          e.target.value,
                        )
                      }
                      placeholder="support@townkart.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportPhone">Support Phone</Label>
                    <Input
                      id="supportPhone"
                      value={settings.platform?.supportPhone || ""}
                      onChange={(e) =>
                        updateSetting(
                          "platform",
                          "supportPhone",
                          e.target.value,
                        )
                      }
                      placeholder="+91-1234567890"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Temporarily disable the platform for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={settings.platform?.maintenanceMode || false}
                    onCheckedChange={(checked) =>
                      updateSetting("platform", "maintenanceMode", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultLanguage">Default Language</Label>
                    <Select
                      value={settings.platform?.defaultLanguage || "en"}
                      onValueChange={(value) =>
                        updateSetting("platform", "defaultLanguage", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="mr">Marathi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <Select
                      value={settings.platform?.defaultCurrency || "INR"}
                      onValueChange={(value) =>
                        updateSetting("platform", "defaultCurrency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Select
                      value={settings.platform?.timezone || "Asia/Kolkata"}
                      onValueChange={(value) =>
                        updateSetting("platform", "timezone", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">
                          Asia/Kolkata (IST)
                        </SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platformCommission">
                    Platform Commission (%)
                  </Label>
                  <Input
                    id="platformCommission"
                    type="number"
                    step="0.1"
                    value={settings.payment?.platformCommission || ""}
                    onChange={(e) =>
                      updateSetting(
                        "payment",
                        "platformCommission",
                        parseFloat(e.target.value),
                      )
                    }
                    placeholder="5.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumOrderValue">
                    Minimum Order Value (₹)
                  </Label>
                  <Input
                    id="minimumOrderValue"
                    type="number"
                    value={settings.payment?.minimumOrderValue || ""}
                    onChange={(e) =>
                      updateSetting(
                        "payment",
                        "minimumOrderValue",
                        parseInt(e.target.value),
                      )
                    }
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Accepted Payment Methods</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      key: "cashOnDelivery",
                      label: "Cash on Delivery",
                      icon: "💵",
                    },
                    { key: "upi", label: "UPI", icon: "📱" },
                    { key: "card", label: "Credit/Debit Card", icon: "💳" },
                    { key: "wallet", label: "Digital Wallets", icon: "👛" },
                  ].map((method) => (
                    <div
                      key={method.key}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="checkbox"
                        id={method.key}
                        checked={
                          settings.payment?.paymentMethods?.includes(
                            method.key,
                          ) || false
                        }
                        onChange={(e) => {
                          const current =
                            settings.payment?.paymentMethods || [];
                          const updated = e.target.checked
                            ? [...current, method.key]
                            : current.filter((m: string) => m !== method.key);
                          updateSetting("payment", "paymentMethods", updated);
                        }}
                        className="rounded"
                      />
                      <Label
                        htmlFor={method.key}
                        className="flex items-center gap-2"
                      >
                        <span>{method.icon}</span>
                        {method.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Process Payments</Label>
                  <p className="text-sm text-gray-500">
                    Automatically process approved payments
                  </p>
                </div>
                <Switch
                  checked={settings.payment?.autoProcessPayments || false}
                  onCheckedChange={(checked) =>
                    updateSetting("payment", "autoProcessPayments", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Settings */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="baseDeliveryFee">Base Delivery Fee (₹)</Label>
                  <Input
                    id="baseDeliveryFee"
                    type="number"
                    value={settings.delivery?.baseDeliveryFee || ""}
                    onChange={(e) =>
                      updateSetting(
                        "delivery",
                        "baseDeliveryFee",
                        parseInt(e.target.value),
                      )
                    }
                    placeholder="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perKmFee">Per KM Fee (₹)</Label>
                  <Input
                    id="perKmFee"
                    type="number"
                    step="0.1"
                    value={settings.delivery?.perKmFee || ""}
                    onChange={(e) =>
                      updateSetting(
                        "delivery",
                        "perKmFee",
                        parseFloat(e.target.value),
                      )
                    }
                    placeholder="5.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freeDeliveryThreshold">
                    Free Delivery Above (₹)
                  </Label>
                  <Input
                    id="freeDeliveryThreshold"
                    type="number"
                    value={settings.delivery?.freeDeliveryThreshold || ""}
                    onChange={(e) =>
                      updateSetting(
                        "delivery",
                        "freeDeliveryThreshold",
                        parseInt(e.target.value),
                      )
                    }
                    placeholder="300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxDeliveryRadius">
                    Max Delivery Radius (KM)
                  </Label>
                  <Input
                    id="maxDeliveryRadius"
                    type="number"
                    value={settings.delivery?.maxDeliveryRadius || ""}
                    onChange={(e) =>
                      updateSetting(
                        "delivery",
                        "maxDeliveryRadius",
                        parseInt(e.target.value),
                      )
                    }
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedDeliveryTime">
                    Estimated Delivery Time (mins)
                  </Label>
                  <Input
                    id="estimatedDeliveryTime"
                    type="number"
                    value={settings.delivery?.estimatedDeliveryTime || ""}
                    onChange={(e) =>
                      updateSetting(
                        "delivery",
                        "estimatedDeliveryTime",
                        parseInt(e.target.value),
                      )
                    }
                    placeholder="45"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Real-time Tracking</Label>
                  <p className="text-sm text-gray-500">
                    Enable GPS tracking for deliveries
                  </p>
                </div>
                <Switch
                  checked={settings.delivery?.realTimeTracking || false}
                  onCheckedChange={(checked) =>
                    updateSetting("delivery", "realTimeTracking", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security?.sessionTimeout || ""}
                      onChange={(e) =>
                        updateSetting(
                          "security",
                          "sessionTimeout",
                          parseInt(e.target.value),
                        )
                      }
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.security?.maxLoginAttempts || ""}
                      onChange={(e) =>
                        updateSetting(
                          "security",
                          "maxLoginAttempts",
                          parseInt(e.target.value),
                        )
                      }
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Security Features</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600">
                          Require 2FA for admin accounts
                        </p>
                      </div>
                      <Switch
                        checked={settings.security?.requireTwoFactor || false}
                        onCheckedChange={(checked) =>
                          updateSetting("security", "requireTwoFactor", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">IP Whitelisting</p>
                        <p className="text-sm text-gray-600">
                          Restrict admin access to specific IPs
                        </p>
                      </div>
                      <Switch
                        checked={settings.security?.ipWhitelisting || false}
                        onCheckedChange={(checked) =>
                          updateSetting("security", "ipWhitelisting", checked)
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Login Notifications</p>
                        <p className="text-sm text-gray-600">
                          Send alerts for suspicious login attempts
                        </p>
                      </div>
                      <Switch
                        checked={settings.security?.loginNotifications || false}
                        onCheckedChange={(checked) =>
                          updateSetting(
                            "security",
                            "loginNotifications",
                            checked,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Email Notifications</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Order Notifications</p>
                      <p className="text-sm text-gray-600">
                        Send email notifications for orders
                      </p>
                    </div>
                    <Switch
                      checked={
                        settings.notifications?.emailOrderNotifications || false
                      }
                      onCheckedChange={(checked) =>
                        updateSetting(
                          "notifications",
                          "emailOrderNotifications",
                          checked,
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delivery Alerts</p>
                      <p className="text-sm text-gray-600">
                        Send delivery status updates
                      </p>
                    </div>
                    <Switch
                      checked={
                        settings.notifications?.emailDeliveryAlerts || false
                      }
                      onCheckedChange={(checked) =>
                        updateSetting(
                          "notifications",
                          "emailDeliveryAlerts",
                          checked,
                        )
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-gray-600">
                        Send promotional content to users
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications?.marketingEmails || false}
                      onCheckedChange={(checked) =>
                        updateSetting(
                          "notifications",
                          "marketingEmails",
                          checked,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>SMS Notifications</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">SMS Alerts</p>
                      <p className="text-sm text-gray-600">
                        Send important updates via SMS
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications?.smsAlerts || false}
                      onCheckedChange={(checked) =>
                        updateSetting("notifications", "smsAlerts", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Feature Toggles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>Customer Features</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Wishlist</p>
                          <p className="text-sm text-gray-600">
                            Allow customers to save favorite products
                          </p>
                        </div>
                        <Switch
                          checked={settings.features?.wishlistEnabled !== false}
                          onCheckedChange={(checked) =>
                            updateSetting(
                              "features",
                              "wishlistEnabled",
                              checked,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Product Reviews</p>
                          <p className="text-sm text-gray-600">
                            Enable customer product reviews
                          </p>
                        </div>
                        <Switch
                          checked={
                            settings.features?.productReviewsEnabled !== false
                          }
                          onCheckedChange={(checked) =>
                            updateSetting(
                              "features",
                              "productReviewsEnabled",
                              checked,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Location Services</p>
                          <p className="text-sm text-gray-600">
                            Enable location-based features
                          </p>
                        </div>
                        <Switch
                          checked={
                            settings.features?.locationServicesEnabled !== false
                          }
                          onCheckedChange={(checked) =>
                            updateSetting(
                              "features",
                              "locationServicesEnabled",
                              checked,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Merchant Features</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Analytics Dashboard</p>
                          <p className="text-sm text-gray-600">
                            Provide merchants with analytics
                          </p>
                        </div>
                        <Switch
                          checked={
                            settings.features?.merchantAnalyticsEnabled !==
                            false
                          }
                          onCheckedChange={(checked) =>
                            updateSetting(
                              "features",
                              "merchantAnalyticsEnabled",
                              checked,
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Bulk Product Upload</p>
                          <p className="text-sm text-gray-600">
                            Allow bulk product imports
                          </p>
                        </div>
                        <Switch
                          checked={
                            settings.features?.bulkUploadEnabled !== false
                          }
                          onCheckedChange={(checked) =>
                            updateSetting(
                              "features",
                              "bulkUploadEnabled",
                              checked,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
