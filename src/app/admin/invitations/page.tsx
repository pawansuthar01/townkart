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
import { Plus, Mail, Check, X, Filter, Copy, ExternalLink } from "lucide-react";

interface Invitation {
  id: string;
  invitedEmail: string;
  invitedPhone?: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
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
  });
  const [creating, setCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");

  useEffect(() => {
    fetchInvitations();
  }, [filterStatus, filterRole]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterRole) params.append("role", filterRole);

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
          <DialogContent>
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
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, role: value }))
                  }
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
                  <SelectItem value="">All</SelectItem>
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
                  <SelectItem value="">All</SelectItem>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Sent By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell>{getStatusBadge(invitation.status)}</TableCell>
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
                        )}
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
