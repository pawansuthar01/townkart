"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Save,
  Mail,
  Shield,
  CreditCard,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface SystemSettings {
  [category: string]: {
    [key: string]: any;
  };
}

export default function AdminSettingsPage() {
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
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Platform Settings
          </h1>
          <p className="text-gray-600">
            Configure platform settings and preferences
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={resetSettings}
            disabled={!hasChanges}
          >
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges || saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
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

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                value={settings.platform?.platformName || ""}
                onChange={(e) =>
                  updateSetting("platform", "platformName", e.target.value)
                }
                placeholder="TownKart"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Support Email</Label>
              <Input
                id="support-email"
                type="email"
                value={settings.platform?.supportEmail || ""}
                onChange={(e) =>
                  updateSetting("platform", "supportEmail", e.target.value)
                }
                placeholder="support@townkart.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Platform Description</Label>
            <Textarea
              id="description"
              value={settings.platform?.platformDescription || ""}
              onChange={(e) =>
                updateSetting("platform", "platformDescription", e.target.value)
              }
              rows={3}
              placeholder="Your one-stop solution for local delivery and shopping"
            />
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

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="commission-rate">Platform Commission (%)</Label>
              <Input
                id="commission-rate"
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
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min-order">Minimum Order Value</Label>
              <Input
                id="min-order"
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cash on Delivery</Label>
              <p className="text-sm text-gray-500">
                Allow customers to pay with cash
              </p>
            </div>
            <Switch
              checked={
                settings.payment?.paymentMethods?.includes("cashOnDelivery") ||
                false
              }
              onCheckedChange={(checked) => {
                const current = settings.payment?.paymentMethods || [];
                const updated = checked
                  ? [...current, "cashOnDelivery"]
                  : current.filter((m: string) => m !== "cashOnDelivery");
                updateSetting("payment", "paymentMethods", updated);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Online Payments</Label>
              <p className="text-sm text-gray-500">
                Enable UPI and card payments
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

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                value={settings.notifications?.smtpHost || ""}
                onChange={(e) =>
                  updateSetting("notifications", "smtpHost", e.target.value)
                }
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                value={settings.notifications?.smtpPort || ""}
                onChange={(e) =>
                  updateSetting(
                    "notifications",
                    "smtpPort",
                    parseInt(e.target.value),
                  )
                }
                placeholder="587"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Order Notifications</Label>
              <p className="text-sm text-gray-500">
                Send email notifications for orders
              </p>
            </div>
            <Switch
              checked={settings.notifications?.emailOrderNotifications || false}
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
            <div className="space-y-0.5">
              <Label>Marketing Emails</Label>
              <p className="text-sm text-gray-500">
                Send promotional emails to users
              </p>
            </div>
            <Switch
              checked={settings.notifications?.marketingEmails || false}
              onCheckedChange={(checked) =>
                updateSetting("notifications", "marketingEmails", checked)
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
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
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
              <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
              <Input
                id="max-login-attempts"
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">
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
            <div className="space-y-0.5">
              <Label>IP Whitelisting</Label>
              <p className="text-sm text-gray-500">
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
        </CardContent>
      </Card>
    </div>
  );
}
