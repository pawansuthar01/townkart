"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Clock, Bell, Shield, Save } from "lucide-react";

interface StoreSettings {
  id: string;
  name: string;
  operatingHours: any;
  autoAcceptOrders: boolean;
  notificationPreferences: {
    newOrders: boolean;
    orderUpdates: boolean;
    deliveryUpdates: boolean;
    systemAlerts: boolean;
  };
  deliverySettings: {
    preparationTime: number;
    autoAssignRiders: boolean;
    maxConcurrentOrders: number;
  };
}

export default function StoreSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // For now, we'll use mock data since we don't have a settings API
      const mockSettings: StoreSettings = {
        id: "store-1",
        name: "My Store",
        operatingHours: {
          monday: { open: "09:00", close: "21:00", closed: false },
          tuesday: { open: "09:00", close: "21:00", closed: false },
          wednesday: { open: "09:00", close: "21:00", closed: false },
          thursday: { open: "09:00", close: "21:00", closed: false },
          friday: { open: "09:00", close: "21:00", closed: false },
          saturday: { open: "09:00", close: "21:00", closed: false },
          sunday: { open: "10:00", close: "18:00", closed: false },
        },
        autoAcceptOrders: false,
        notificationPreferences: {
          newOrders: true,
          orderUpdates: true,
          deliveryUpdates: true,
          systemAlerts: true,
        },
        deliverySettings: {
          preparationTime: 15,
          autoAssignRiders: true,
          maxConcurrentOrders: 10,
        },
      };
      setSettings(mockSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      // In a real app, you'd save to an API
      // await fetch("/api/store/settings", {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(settings),
      // });

      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Settings saved:", settings);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateOperatingHours = (
    day: string,
    field: string,
    value: string | boolean,
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      operatingHours: {
        ...settings.operatingHours,
        [day]: {
          ...settings.operatingHours[day],
          [field]: value,
        },
      },
    });
  };

  const updateNotificationPreferences = (
    key: keyof StoreSettings["notificationPreferences"],
    value: boolean,
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      notificationPreferences: {
        ...settings.notificationPreferences,
        [key]: value,
      },
    });
  };

  const updateDeliverySettings = (
    key: keyof StoreSettings["deliverySettings"],
    value: number | boolean,
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      deliverySettings: {
        ...settings.deliverySettings,
        [key]: value,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Unable to load store settings</p>
      </div>
    );
  }

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600">
            Configure your store preferences and operations
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {days.map((day) => (
            <div
              key={day}
              className="flex items-center gap-4 p-3 border rounded-lg"
            >
              <div className="w-24 capitalize font-medium">{day}</div>
              <Switch
                checked={!settings.operatingHours[day].closed}
                onCheckedChange={(checked) =>
                  updateOperatingHours(day, "closed", !checked)
                }
              />
              {!settings.operatingHours[day].closed && (
                <>
                  <Input
                    type="time"
                    value={settings.operatingHours[day].open}
                    onChange={(e) =>
                      updateOperatingHours(day, "open", e.target.value)
                    }
                    className="w-32"
                  />
                  <span>to</span>
                  <Input
                    type="time"
                    value={settings.operatingHours[day].close}
                    onChange={(e) =>
                      updateOperatingHours(day, "close", e.target.value)
                    }
                    className="w-32"
                  />
                </>
              )}
              {settings.operatingHours[day].closed && (
                <span className="text-gray-500">Closed</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-accept">Auto-accept new orders</Label>
              <p className="text-sm text-gray-600">
                Automatically accept orders without manual approval
              </p>
            </div>
            <Switch
              id="auto-accept"
              checked={settings.autoAcceptOrders}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoAcceptOrders: checked })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prep-time">
                Average preparation time (minutes)
              </Label>
              <Input
                id="prep-time"
                type="number"
                value={settings.deliverySettings.preparationTime}
                onChange={(e) =>
                  updateDeliverySettings(
                    "preparationTime",
                    parseInt(e.target.value),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="max-orders">Max concurrent orders</Label>
              <Input
                id="max-orders"
                type="number"
                value={settings.deliverySettings.maxConcurrentOrders}
                onChange={(e) =>
                  updateDeliverySettings(
                    "maxConcurrentOrders",
                    parseInt(e.target.value),
                  )
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-assign">Auto-assign riders</Label>
              <p className="text-sm text-gray-600">
                Automatically assign available riders to orders
              </p>
            </div>
            <Switch
              id="auto-assign"
              checked={settings.deliverySettings.autoAssignRiders}
              onCheckedChange={(checked) =>
                updateDeliverySettings("autoAssignRiders", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="new-orders">New order notifications</Label>
              <p className="text-sm text-gray-600">
                Get notified when new orders are placed
              </p>
            </div>
            <Switch
              id="new-orders"
              checked={settings.notificationPreferences.newOrders}
              onCheckedChange={(checked) =>
                updateNotificationPreferences("newOrders", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="order-updates">Order status updates</Label>
              <p className="text-sm text-gray-600">
                Notifications for order status changes
              </p>
            </div>
            <Switch
              id="order-updates"
              checked={settings.notificationPreferences.orderUpdates}
              onCheckedChange={(checked) =>
                updateNotificationPreferences("orderUpdates", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="delivery-updates">Delivery updates</Label>
              <p className="text-sm text-gray-600">
                Updates on delivery progress
              </p>
            </div>
            <Switch
              id="delivery-updates"
              checked={settings.notificationPreferences.deliveryUpdates}
              onCheckedChange={(checked) =>
                updateNotificationPreferences("deliveryUpdates", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="system-alerts">System alerts</Label>
              <p className="text-sm text-gray-600">
                Important system notifications
              </p>
            </div>
            <Switch
              id="system-alerts"
              checked={settings.notificationPreferences.systemAlerts}
              onCheckedChange={(checked) =>
                updateNotificationPreferences("systemAlerts", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Security settings are managed at the account level. Contact
              support for advanced security configurations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
