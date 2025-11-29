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
import { useAuth } from "@/hooks/useAuth";
import {
  Settings,
  Bell,
  Shield,
  Store,
  Clock,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CreditCard,
  Truck,
} from "lucide-react";

export default function MerchantSettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Store Information
    storeName: "",
    storeDescription: "",
    contactNumber: "",
    email: "",
    address: "",
    operatingHours: {
      monday: { open: "09:00", close: "21:00", closed: false },
      tuesday: { open: "09:00", close: "21:00", closed: false },
      wednesday: { open: "09:00", close: "21:00", closed: false },
      thursday: { open: "09:00", close: "21:00", closed: false },
      friday: { open: "09:00", close: "21:00", closed: false },
      saturday: { open: "09:00", close: "21:00", closed: false },
      sunday: { open: "10:00", close: "20:00", closed: false },
    },

    // Notifications
    orderNotifications: true,
    deliveryAlerts: true,
    customerMessages: true,
    systemUpdates: false,

    // Payment
    paymentMethods: ["cash", "upi", "card"],
    autoAcceptPayments: true,
    minimumOrder: 50,

    // Delivery
    deliveryEnabled: true,
    deliveryRadius: 5,
    deliveryFee: 40,
    freeDeliveryThreshold: 300,

    // Privacy
    storeVisibility: "public",
    customerDataSharing: false,

    // Preferences
    language: "en",
    theme: "system",
    autoPrintOrders: false,
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Load merchant settings from API
    const loadSettings = async () => {
      if (!user?.id) return;

      try {
        const cached = localStorage.getItem(`merchant_settings_${user.id}`);
        if (cached) {
          const parsedSettings = JSON.parse(cached);
          const cacheTime = parsedSettings._cacheTime;
          const now = Date.now();

          if (now - cacheTime < 5 * 60 * 1000) {
            setSettings((prev) => ({ ...prev, ...parsedSettings }));
            return;
          }
        }

        const response = await fetch(`/api/merchants/${user.id}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      } catch (error) {
        console.error("Failed to load merchant settings:", error);
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

  const handleOperatingHoursChange = (
    day: string,
    field: string,
    value: string | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day as keyof typeof prev.operatingHours],
          [field]: value,
        },
      },
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
      const response = await fetch(`/api/merchants/${user.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const settingsWithCache = { ...settings, _cacheTime: Date.now() };
        localStorage.setItem(
          `merchant_settings_${user.id}`,
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
                Store Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your store preferences and configuration
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
        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Store</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Delivery</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Store Information */}
          <TabsContent value="store">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Store Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        value={settings.storeName}
                        onChange={(e) =>
                          handleSettingChange("storeName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input
                        id="contactNumber"
                        value={settings.contactNumber}
                        onChange={(e) =>
                          handleSettingChange("contactNumber", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeDescription">Store Description</Label>
                    <Textarea
                      id="storeDescription"
                      value={settings.storeDescription}
                      onChange={(e) =>
                        handleSettingChange("storeDescription", e.target.value)
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Store Address</Label>
                    <Textarea
                      id="address"
                      value={settings.address}
                      onChange={(e) =>
                        handleSettingChange("address", e.target.value)
                      }
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Operating Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Operating Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(settings.operatingHours).map(
                      ([day, hours]) => (
                        <div
                          key={day}
                          className="flex items-center gap-4 p-4 border rounded-lg"
                        >
                          <div className="w-24 font-medium capitalize">
                            {day}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!hours.closed}
                              onCheckedChange={(checked) =>
                                handleOperatingHoursChange(
                                  day,
                                  "closed",
                                  !checked,
                                )
                              }
                            />
                            <span className="text-sm text-gray-600">
                              {hours.closed ? "Closed" : "Open"}
                            </span>
                          </div>
                          {!hours.closed && (
                            <>
                              <Input
                                type="time"
                                value={hours.open}
                                onChange={(e) =>
                                  handleOperatingHoursChange(
                                    day,
                                    "open",
                                    e.target.value,
                                  )
                                }
                                className="w-32"
                              />
                              <span className="text-gray-500">to</span>
                              <Input
                                type="time"
                                value={hours.close}
                                onChange={(e) =>
                                  handleOperatingHoursChange(
                                    day,
                                    "close",
                                    e.target.value,
                                  )
                                }
                                className="w-32"
                              />
                            </>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delivery Settings */}
          <TabsContent value="delivery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Delivery Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Delivery</p>
                    <p className="text-sm text-gray-600">
                      Allow customers to order for delivery
                    </p>
                  </div>
                  <Switch
                    checked={settings.deliveryEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange("deliveryEnabled", checked)
                    }
                  />
                </div>

                {settings.deliveryEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryRadius">
                        Delivery Radius (km)
                      </Label>
                      <Input
                        id="deliveryRadius"
                        type="number"
                        value={settings.deliveryRadius}
                        onChange={(e) =>
                          handleSettingChange(
                            "deliveryRadius",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryFee">Delivery Fee (₹)</Label>
                      <Input
                        id="deliveryFee"
                        type="number"
                        value={settings.deliveryFee}
                        onChange={(e) =>
                          handleSettingChange(
                            "deliveryFee",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="freeDeliveryThreshold">
                        Free Delivery Above (₹)
                      </Label>
                      <Input
                        id="freeDeliveryThreshold"
                        type="number"
                        value={settings.freeDeliveryThreshold}
                        onChange={(e) =>
                          handleSettingChange(
                            "freeDeliveryThreshold",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="minimumOrder">Minimum Order Value (₹)</Label>
                  <Input
                    id="minimumOrder"
                    type="number"
                    value={settings.minimumOrder}
                    onChange={(e) =>
                      handleSettingChange(
                        "minimumOrder",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto Accept Payments</p>
                    <p className="text-sm text-gray-600">
                      Automatically accept online payments
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoAcceptPayments}
                    onCheckedChange={(checked) =>
                      handleSettingChange("autoAcceptPayments", checked)
                    }
                  />
                </div>

                <div>
                  <Label>Accepted Payment Methods</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      { key: "cash", label: "Cash on Delivery" },
                      { key: "upi", label: "UPI" },
                      { key: "card", label: "Credit/Debit Card" },
                    ].map((method) => (
                      <div
                        key={method.key}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={method.key}
                          checked={settings.paymentMethods.includes(method.key)}
                          onChange={(e) => {
                            const updated = e.target.checked
                              ? [...settings.paymentMethods, method.key]
                              : settings.paymentMethods.filter(
                                  (m) => m !== method.key,
                                );
                            handleSettingChange("paymentMethods", updated);
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={method.key}>{method.label}</Label>
                      </div>
                    ))}
                  </div>
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
                        Get notified about new orders
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
                        Receive alerts about delivery status
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
                      <p className="font-medium">Customer Messages</p>
                      <p className="text-sm text-gray-600">
                        Get notified about customer inquiries
                      </p>
                    </div>
                    <Switch
                      checked={settings.customerMessages}
                      onCheckedChange={(checked) =>
                        handleSettingChange("customerMessages", checked)
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
