"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Phone,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface NotificationSettings {
  [key: string]: {
    enabled: boolean;
    channels: {
      in_app: boolean;
      push: boolean;
      sms: boolean;
      email: boolean;
      whatsapp: boolean;
    };
  };
}

interface OTPSettings {
  delivery_method: "email" | "sms" | "both";
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  otp_length: number;
  expiry_minutes: number;
  max_attempts: number;
  cooldown_minutes: number;
}

export default function AdminNotificationSettingsPage() {
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      order_status_update: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      delivery_assigned: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: true,
          email: false,
          whatsapp: false,
        },
      },
      delivery_started: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      delivery_completed: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: true,
          email: false,
          whatsapp: false,
        },
      },
      payment_received: {
        enabled: true,
        channels: {
          in_app: true,
          push: false,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      payment_failed: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: true,
          email: false,
          whatsapp: false,
        },
      },
      rider_location_update: {
        enabled: false,
        channels: {
          in_app: true,
          push: false,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      rider_delivery_offer: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      merchant_order_ready: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      customer_support: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      promotional: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      system_alert: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: true,
          whatsapp: false,
        },
      },
      admin_manual: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      store_manual: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: false,
          whatsapp: false,
        },
      },
      login_alert: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: false,
          email: true,
          whatsapp: false,
        },
      },
      device_change: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: true,
          email: true,
          whatsapp: false,
        },
      },
      security_alert: {
        enabled: true,
        channels: {
          in_app: true,
          push: true,
          sms: true,
          email: true,
          whatsapp: true,
        },
      },
    });

  const [otpSettings, setOtpSettings] = useState<OTPSettings>({
    delivery_method: "sms",
    email_enabled: true,
    sms_enabled: true,
    whatsapp_enabled: false,
    otp_length: 6,
    expiry_minutes: 10,
    max_attempts: 3,
    cooldown_minutes: 5,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/notification-settings");
      const data = await response.json();

      if (data.success) {
        if (data.data.notifications) {
          setNotificationSettings((prev) => ({
            ...prev,
            ...data.data.notifications,
          }));
        }
        if (data.data.otp) {
          setOtpSettings((prev) => ({ ...prev, ...data.data.otp }));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Save notification settings
      await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "notifications",
          settings: notificationSettings,
        }),
      });

      // Save OTP settings
      await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "otp",
          settings: otpSettings,
        }),
      });

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSetting = (
    type: string,
    field: string,
    value: boolean,
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]:
          field === "enabled"
            ? value
            : {
                ...prev[type].channels,
                [field]: value,
              },
      },
    }));
  };

  const updateOTPSetting = (field: string, value: any) => {
    setOtpSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "in_app":
        return <Bell className="h-4 w-4" />;
      case "push":
        return <Smartphone className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      case "whatsapp":
        return <Phone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelName = (channel: string) => {
    switch (channel) {
      case "in_app":
        return "In-App";
      case "push":
        return "Push";
      case "sms":
        return "SMS";
      case "email":
        return "Email";
      case "whatsapp":
        return "WhatsApp";
      default:
        return channel;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Notification Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Control notification channels and OTP delivery methods
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* OTP Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            OTP Delivery Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  Primary Delivery Method
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Choose how OTPs are primarily delivered
                </p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="delivery_method"
                      value="sms"
                      checked={otpSettings.delivery_method === "sms"}
                      onChange={(e) =>
                        updateOTPSetting("delivery_method", e.target.value)
                      }
                    />
                    <span>SMS (Primary)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="delivery_method"
                      value="email"
                      checked={otpSettings.delivery_method === "email"}
                      onChange={(e) =>
                        updateOTPSetting("delivery_method", e.target.value)
                      }
                    />
                    <span>Email (Primary)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="delivery_method"
                      value="both"
                      checked={otpSettings.delivery_method === "both"}
                      onChange={(e) =>
                        updateOTPSetting("delivery_method", e.target.value)
                      }
                    />
                    <span>Both SMS & Email</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  Available Channels
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Enable/disable OTP delivery channels
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>SMS</span>
                    </div>
                    <Switch
                      checked={otpSettings.sms_enabled}
                      onCheckedChange={(checked) =>
                        updateOTPSetting("sms_enabled", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                    <Switch
                      checked={otpSettings.email_enabled}
                      onCheckedChange={(checked) =>
                        updateOTPSetting("email_enabled", checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </div>
                    <Switch
                      checked={otpSettings.whatsapp_enabled}
                      onCheckedChange={(checked) =>
                        updateOTPSetting("whatsapp_enabled", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>OTP Length</Label>
              <select
                value={otpSettings.otp_length}
                onChange={(e) =>
                  updateOTPSetting("otp_length", parseInt(e.target.value))
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={4}>4 digits</option>
                <option value={6}>6 digits</option>
                <option value={8}>8 digits</option>
              </select>
            </div>
            <div>
              <Label>Expiry (minutes)</Label>
              <input
                type="number"
                value={otpSettings.expiry_minutes}
                onChange={(e) =>
                  updateOTPSetting("expiry_minutes", parseInt(e.target.value))
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                min={1}
                max={60}
              />
            </div>
            <div>
              <Label>Max Attempts</Label>
              <input
                type="number"
                value={otpSettings.max_attempts}
                onChange={(e) =>
                  updateOTPSetting("max_attempts", parseInt(e.target.value))
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                min={1}
                max={10}
              />
            </div>
            <div>
              <Label>Cooldown (minutes)</Label>
              <input
                type="number"
                value={otpSettings.cooldown_minutes}
                onChange={(e) =>
                  updateOTPSetting("cooldown_minutes", parseInt(e.target.value))
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                min={0}
                max={60}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channel Control
          </CardTitle>
          <p className="text-sm text-gray-600">
            Control which notification types are enabled and through which
            channels they are sent
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(notificationSettings).map(([type, settings]) => (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-gray-900 capitalize">
                      {type.replace(/_/g, " ")}
                    </h3>
                    <Badge variant={settings.enabled ? "default" : "secondary"}>
                      {settings.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) =>
                      updateNotificationSetting(type, "enabled", checked)
                    }
                  />
                </div>

                {settings.enabled && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(settings.channels).map(
                      ([channel, enabled]) => (
                        <div
                          key={channel}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            {getChannelIcon(channel)}
                            <span className="text-sm font-medium">
                              {getChannelName(channel)}
                            </span>
                          </div>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) =>
                              updateNotificationSetting(type, channel, checked)
                            }
                          />
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}
