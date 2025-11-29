"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  Users,
  MapPin,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  recipientCount: number;
  sentBy: string;
  sentAt: string;
  status: string;
  channels: string[];
  actions?: Array<{
    label: string;
    action: string;
    params: any;
  }>;
}

interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
}

export default function StoreNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "promotional",
    targetAudience: "all_customers",
    channels: ["in_app", "push"] as string[],
    actionLabel: "",
    actionType: "none",
    actionParams: "",
  });

  useEffect(() => {
    fetchNotifications();
    fetchCustomers();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/store/notifications");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      // Get customers who have ordered from this store
      const response = await fetch("/api/store/customers");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomers(data.customers);
        }
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleSendNotification = async () => {
    try {
      const notificationData = {
        ...newNotification,
        recipientUserIds:
          newNotification.targetAudience === "selected_customers"
            ? selectedCustomers
            : undefined,
        actions:
          newNotification.actionType !== "none"
            ? [
                {
                  label: newNotification.actionLabel,
                  action: newNotification.actionType,
                  params: newNotification.actionParams
                    ? JSON.parse(newNotification.actionParams)
                    : {},
                },
              ]
            : undefined,
      };

      const response = await fetch("/api/store/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const resetForm = () => {
    setNewNotification({
      title: "",
      message: "",
      type: "promotional",
      targetAudience: "all_customers",
      channels: ["in_app", "push"],
      actionLabel: "",
      actionType: "none",
      actionParams: "",
    });
    setSelectedCustomers([]);
  };

  const getTargetAudienceLabel = (audience: string) => {
    switch (audience) {
      case "all_customers":
        return "All Customers";
      case "selected_customers":
        return "Selected Customers";
      case "location_based":
        return "Location Based";
      default:
        return audience;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "sent":
        return "default";
      case "sending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Store Notifications
          </h1>
          <p className="text-gray-600">Send notifications to your customers</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchNotifications} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Send New Notification</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Notification Title</Label>
                    <Input
                      id="title"
                      value={newNotification.title}
                      onChange={(e) =>
                        setNewNotification({
                          ...newNotification,
                          title: e.target.value,
                        })
                      }
                      placeholder="Enter notification title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={newNotification.message}
                      onChange={(e) =>
                        setNewNotification({
                          ...newNotification,
                          message: e.target.value,
                        })
                      }
                      placeholder="Enter notification message"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Notification Type</Label>
                    <Select
                      value={newNotification.type}
                      onValueChange={(value) =>
                        setNewNotification({ ...newNotification, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotional">Promotional</SelectItem>
                        <SelectItem value="order_update">
                          Order Update
                        </SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Select
                      value={newNotification.targetAudience}
                      onValueChange={(value) =>
                        setNewNotification({
                          ...newNotification,
                          targetAudience: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_customers">
                          All Customers
                        </SelectItem>
                        <SelectItem value="selected_customers">
                          Selected Customers
                        </SelectItem>
                        <SelectItem value="location_based">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location Based
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Channels</Label>
                    <div className="space-y-2">
                      {["in_app", "push", "sms"].map((channel) => (
                        <div
                          key={channel}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`channel-${channel}`}
                            checked={newNotification.channels.includes(channel)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewNotification({
                                  ...newNotification,
                                  channels: [
                                    ...newNotification.channels,
                                    channel,
                                  ],
                                });
                              } else {
                                setNewNotification({
                                  ...newNotification,
                                  channels: newNotification.channels.filter(
                                    (c) => c !== channel,
                                  ),
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <Label
                            htmlFor={`channel-${channel}`}
                            className="capitalize"
                          >
                            {channel.replace("_", " ")}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="actionType">Action Type</Label>
                    <Select
                      value={newNotification.actionType}
                      onValueChange={(value) =>
                        setNewNotification({
                          ...newNotification,
                          actionType: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Action</SelectItem>
                        <SelectItem value="navigate">
                          Navigate to Page
                        </SelectItem>
                        <SelectItem value="external_link">
                          External Link
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newNotification.actionType !== "none" && (
                    <>
                      <div>
                        <Label htmlFor="actionLabel">Action Button Label</Label>
                        <Input
                          id="actionLabel"
                          value={newNotification.actionLabel}
                          onChange={(e) =>
                            setNewNotification({
                              ...newNotification,
                              actionLabel: e.target.value,
                            })
                          }
                          placeholder="e.g., Order Now, View Menu"
                        />
                      </div>

                      <div>
                        <Label htmlFor="actionParams">Action Parameters</Label>
                        <Textarea
                          id="actionParams"
                          value={newNotification.actionParams}
                          onChange={(e) =>
                            setNewNotification({
                              ...newNotification,
                              actionParams: e.target.value,
                            })
                          }
                          placeholder='For navigate: {"route": "/products"}&#10;For external_link: {"url": "https://example.com"}'
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {/* Customer Selection */}
                  {newNotification.targetAudience === "selected_customers" && (
                    <div>
                      <Label>
                        Select Customers ({selectedCustomers.length} selected)
                      </Label>
                      <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                        {customers.slice(0, 50).map((customer) => (
                          <div
                            key={customer.id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`customer-${customer.id}`}
                              checked={selectedCustomers.includes(customer.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCustomers([
                                    ...selectedCustomers,
                                    customer.id,
                                  ]);
                                } else {
                                  setSelectedCustomers(
                                    selectedCustomers.filter(
                                      (id) => id !== customer.id,
                                    ),
                                  );
                                }
                              }}
                              className="rounded"
                            />
                            <Label
                              htmlFor={`customer-${customer.id}`}
                              className="text-sm"
                            >
                              {customer.fullName} ({customer.phoneNumber})
                            </Label>
                          </div>
                        ))}
                      </div>
                      {customers.length > 50 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Showing first 50 customers. Use search for more
                          specific selection.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSendNotification}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                notifications.filter((n) => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(n.sentAt) > weekAgo;
                }).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promotional</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter((n) => n.type === "promotional").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sent Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target Audience</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium">
                    {notification.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {notification.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getTargetAudienceLabel("all_customers")}
                    </Badge>
                  </TableCell>
                  <TableCell>{notification.recipientCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {notification.channels.map((channel) => (
                        <Badge
                          key={channel}
                          variant="outline"
                          className="text-xs"
                        >
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(notification.status)}>
                      {notification.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(notification.sentAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
