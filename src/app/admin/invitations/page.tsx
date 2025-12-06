"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Mail, Check, X, Filter, Copy, ExternalLink } from "lucide-react";

interface Invitation {
  id: string;
  invitedEmail: string;
  invitedPhone?: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  storeId?: string;
  serviceAreas?: string[];
  stores?: string[];
  notificationChannels?: string[];
  invitedByUser?: {
    fullName: string;
    email: string;
  };
  usedByUser?: {
    fullName: string;
    email: string;
  };
}

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    phone: "",
    role: "RIDER",
    message: "",
    expiresInHours: 24,
    storeId: "",
    serviceAreas: [] as string[],
    stores: [] as string[],
    notificationChannels: ["EMAIL"] as string[],
  });
  const [serviceAreas, setServiceAreas] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");

  useEffect(() => {
    fetchInvitations();
    fetchServiceAreas();
    fetchStores();
  }, [filterStatus, filterRole]);

  const fetchServiceAreas = async () => {
    try {
      const response = await fetch("/api/admin/service-areas");
      if (response.ok) {
        const data = await response.json();
        setServiceAreas(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch service areas:", error);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/admin/stores?limit=1000");
      if (response.ok) {
        const data = await response.json();
        setStores(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== "ALL")
        params.append("status", filterStatus);
      if (filterRole && filterRole !== "ALL") params.append("role", filterRole);

      const response = await fetch(`/api/admin/invitations?${params}`);
      if (!response.ok) throw new Error("Failed to fetch invitations");

      const data = await response.json();
      setInvitations(data.invitations);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setSuccess("Invitation sent successfully!");
      setShowCreateDialog(false);
      setCreateForm({
        email: "",
        phone: "",
        role: "RIDER",
        message: "",
        expiresInHours: 24,
        storeId: "",
        serviceAreas: [],
        stores: [],
        notificationChannels: ["EMAIL"],
      });
      fetchInvitations();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    try {
      const response = await fetch("/api/admin/invitations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setSuccess(`Invitation ${action}d successfully!`);
      fetchInvitations();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Link copied to clipboard!");
  };

  const getAssignmentDisplay = (invitation: Invitation) => {
    if (invitation.role === "STORE_MANAGER" && invitation.storeId) {
      const store = stores.find((s) => s.id === invitation.storeId);
      return store ? `${store.name} (${store.code})` : "Store assigned";
    } else if (invitation.role === "RIDER") {
      const assignments = [];
      if (invitation.serviceAreas && invitation.serviceAreas.length > 0) {
        const areaNames = invitation.serviceAreas
          .map((id) => serviceAreas.find((a) => a.id === id)?.name)
          .filter(Boolean);
        if (areaNames.length > 0) {
          assignments.push(`${areaNames.length} service area(s)`);
        }
      }
      if (invitation.stores && invitation.stores.length > 0) {
        assignments.push(`${invitation.stores.length} store(s)`);
      }
      return assignments.length > 0 ? assignments.join(", ") : "No assignments";
    }
    return "No assignments";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="default">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "USED":
        return <Badge variant="outline">Used</Badge>;
      case "EXPIRED":
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getNotificationStatusDisplay = (invitation: Invitation) => {
    if (
      !invitation.notificationChannels ||
      invitation.notificationChannels.length === 0
    ) {
      return <span className="text-gray-500 text-sm">No notifications</span>;
    }

    const channels = invitation.notificationChannels.map((channel) => {
      switch (channel) {
        case "EMAIL":
          return "📧";
        case "WHATSAPP":
          return "💬";
        case "SMS":
          return "📱";
        default:
          return channel;
      }
    });

    return (
      <div className="flex items-center gap-1">
        <span className="text-sm">{channels.join(" ")}</span>
        <Badge variant="default" className="text-xs">
          {invitation.notificationChannels.length} sent
        </Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invitations</h1>
          <p className="text-gray-600">Manage user invitations and approvals</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Send Invitation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Invitation</DialogTitle>
              <DialogDescription>
                Send an invitation for riders or store managers to join the
                platform
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInvitation} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  placeholder="+919876543210"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => {
                    setCreateForm((prev) => ({
                      ...prev,
                      role: value,
                      storeId: "",
                      serviceAreas: [],
                      stores: [],
                      notificationChannels: ["EMAIL"],
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RIDER">Rider</SelectItem>
                    <SelectItem value="STORE_MANAGER">Store Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {createForm.role === "STORE_MANAGER" && (
                <div>
                  <Label htmlFor="storeId">Store</Label>
                  <Select
                    value={createForm.storeId}
                    onValueChange={(value) =>
                      setCreateForm((prev) => ({ ...prev, storeId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name} ({store.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {createForm.role === "RIDER" && (
                <>
                  <div>
                    <Label>Service Areas (Optional)</Label>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                      {serviceAreas.map((area) => (
                        <div
                          key={area.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`service-area-${area.id}`}
                            checked={createForm.serviceAreas.includes(area.id)}
                            onCheckedChange={(checked) => {
                              setCreateForm((prev) => ({
                                ...prev,
                                serviceAreas: checked
                                  ? [...prev.serviceAreas, area.id]
                                  : prev.serviceAreas.filter(
                                      (id) => id !== area.id
                                    ),
                              }));
                            }}
                          />
                          <Label
                            htmlFor={`service-area-${area.id}`}
                            className="text-sm"
                          >
                            {area.name} ({area.city})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Stores (Optional)</Label>
                    <div className="max-h-40 overflow-y-auto border rounded-md p-3 space-y-2">
                      {stores.map((store) => (
                        <div
                          key={store.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`store-${store.id}`}
                            checked={createForm.stores.includes(store.id)}
                            onCheckedChange={(checked) => {
                              setCreateForm((prev) => ({
                                ...prev,
                                stores: checked
                                  ? [...prev.stores, store.id]
                                  : prev.stores.filter((id) => id !== store.id),
                              }));
                            }}
                          />
                          <Label
                            htmlFor={`store-${store.id}`}
                            className="text-sm"
                          >
                            {store.name} ({store.code})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Input
                  id="message"
                  value={createForm.message}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  placeholder="Personal message to include in invitation"
                />
              </div>

              <div>
                <Label>Notification Channels</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-channel"
                      checked={createForm.notificationChannels.includes(
                        "EMAIL"
                      )}
                      onCheckedChange={(checked) => {
                        setCreateForm((prev) => ({
                          ...prev,
                          notificationChannels: checked
                            ? [...prev.notificationChannels, "EMAIL"]
                            : prev.notificationChannels.filter(
                                (c) => c !== "EMAIL"
                              ),
                        }));
                      }}
                    />
                    <Label htmlFor="email-channel" className="text-sm">
                      📧 Email
                    </Label>
                  </div>
                  {createForm.phone && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="whatsapp-channel"
                          checked={createForm.notificationChannels.includes(
                            "WHATSAPP"
                          )}
                          onCheckedChange={(checked) => {
                            setCreateForm((prev) => ({
                              ...prev,
                              notificationChannels: checked
                                ? [...prev.notificationChannels, "WHATSAPP"]
                                : prev.notificationChannels.filter(
                                    (c) => c !== "WHATSAPP"
                                  ),
                            }));
                          }}
                        />
                        <Label htmlFor="whatsapp-channel" className="text-sm">
                          💬 WhatsApp
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sms-channel"
                          checked={createForm.notificationChannels.includes(
                            "SMS"
                          )}
                          onCheckedChange={(checked) => {
                            setCreateForm((prev) => ({
                              ...prev,
                              notificationChannels: checked
                                ? [...prev.notificationChannels, "SMS"]
                                : prev.notificationChannels.filter(
                                    (c) => c !== "SMS"
                                  ),
                            }));
                          }}
                        />
                        <Label htmlFor="sms-channel" className="text-sm">
                          📱 SMS
                        </Label>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Select how you want to send the invitation. WhatsApp and SMS
                  require a phone number. In-app notifications are not available
                  for invitations since the recipient doesn't have an account
                  yet.
                </p>
              </div>
              <div>
                <Label htmlFor="expiresInHours">Expires in (hours)</Label>
                <Input
                  id="expiresInHours"
                  type="number"
                  min="1"
                  max="168"
                  value={createForm.expiresInHours}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      expiresInHours: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Send Invitation
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="USED">Used</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="RIDER">Rider</SelectItem>
                  <SelectItem value="STORE_MANAGER">Store Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Invitations</CardTitle>
          <CardDescription>
            View and manage all sent invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner className="w-8 h-8" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notifications</TableHead>
                  <TableHead>Sent By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Url</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {invitation.invitedEmail}
                        </div>
                        {invitation.invitedPhone && (
                          <div className="text-sm text-gray-500">
                            {invitation.invitedPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invitation.role === "STORE_MANAGER"
                        ? "Store Manager"
                        : invitation.role}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {getAssignmentDisplay(invitation)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                    <TableCell>
                      {getNotificationStatusDisplay(invitation)}
                    </TableCell>
                    <TableCell>
                      {invitation.invitedByUser?.fullName || "System"}
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {invitation.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(invitation.id, "approve")
                              }
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(invitation.id, "reject")
                              }
                            >
                              <X className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {invitation.status === "APPROVED" && (
                          <div className="text-sm text-gray-500">Approved</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/auth/register?token=${invitation.id}`
                            )
                          }
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
