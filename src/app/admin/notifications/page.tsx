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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  Users,
  Store,
  User,
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
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

interface User {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  userRoles: string[];
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "promotional",
    targetAudience: "all_users",
    channels: ["in_app", "push"] as string[],
    actionLabel: "",
    actionType: "none",
    actionParams: "",
  });

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/admin/notifications");
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

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=1000");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSendNotification = async () => {
    try {
      const notificationData = {
        ...newNotification,
        recipientUserIds:
          newNotification.targetAudience === "selected_users"
            ? selectedUsers
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

      const response = await fetch("/api/admin/notifications", {
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
      targetAudience: "all_users",
      channels: ["in_app", "push"],
      actionLabel: "",
      actionType: "none",
      actionParams: "",
    });
    setSelectedUsers([]);
  };

  const getTargetAudienceLabel = (audience: string) => {
    switch (audience) {
      case "all_users":
        return "All Users";
      case "customers_only":
        return "Customers Only";
      case "store_managers_only":
        return "Store Managers Only";
      case "riders_only":
        return "Riders Only";
      case "selected_users":
        return "Selected Users";
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
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            Send notifications to users and manage communication
          </p>
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
                        <SelectItem value="system_alert">
                          System Alert
                        </SelectItem>
                        <SelectItem value="customer_support">
                          Customer Support
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
                        <SelectItem value="all_users">All Users</SelectItem>
                        <SelectItem value="customers_only">
                          Customers Only
                        </SelectItem>
                        <SelectItem value="store_managers_only">
                          Store Managers Only
                        </SelectItem>
                        <SelectItem value="riders_only">Riders Only</SelectItem>
                        <SelectItem value="selected_users">
                          Selected Users
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Channels</Label>
                    <div className="space-y-2">
                      {["in_app", "push", "sms", "email"].map((channel) => (
                        <div
                          key={channel}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`channel-${channel}`}
                            checked={newNotification.channels.includes(channel)}
                            onCheckedChange={(checked) => {
                              if (checked) {
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
                          placeholder="e.g., View Details, Shop Now"
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

                  {/* User Selection */}
                  {newNotification.targetAudience === "selected_users" && (
                    <div>
                      <Label>
                        Select Users ({selectedUsers.length} selected)
                      </Label>
                      <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                        {users.slice(0, 50).map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(
                                    selectedUsers.filter(
                                      (id) => id !== user.id,
                                    ),
                                  );
                                }
                              }}
                            />
                            <Label
                              htmlFor={`user-${user.id}`}
                              className="text-sm"
                            >
                              {user.fullName} ({user.phoneNumber})
                              <Badge variant="outline" className="ml-2 text-xs">
                                {user.userRoles.join(", ")}
                              </Badge>
                            </Label>
                          </div>
                        ))}
                      </div>
                      {users.length > 50 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Showing first 50 users. Use search for more specific
                          selection.
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
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter((n) => n.type === "promotional").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter((n) => n.type === "system_alert").length}
            </div>
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
                      {getTargetAudienceLabel(notification.targetAudience)}
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
