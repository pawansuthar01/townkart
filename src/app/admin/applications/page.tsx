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
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  X,
  Eye,
  Filter,
  Download,
  MapPin,
  FileText,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { MapIntegration } from "@/components/shared/MapIntegration";

interface Application {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "RIDER" | "STORE_MANAGER";
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  storeId?: string;
  documents?: Record<string, string>;
  invitation: {
    serviceAreas?: string[];
    stores?: string[];
  };
}

interface ServiceArea {
  id: string;
  name: string;
  city: string;
  state: string;
  centerLat: number;
  centerLng: number;
}

interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");

  useEffect(() => {
    fetchApplications();
    fetchServiceAreasAndStores();
  }, [filterStatus, filterRole]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== "ALL")
        params.append("status", filterStatus);
      if (filterRole && filterRole !== "ALL") params.append("role", filterRole);

      const response = await fetch(`/api/admin/applications?${params}`);
      if (!response.ok) throw new Error("Failed to fetch applications");

      const data = await response.json();
      setApplications(data.applications);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceAreasAndStores = async () => {
    try {
      const [areasResponse, storesResponse] = await Promise.all([
        fetch("/api/admin/service-areas"),
        fetch("/api/admin/stores?limit=1000"),
      ]);

      if (areasResponse.ok) {
        const areasData = await areasResponse.json();
        setServiceAreas(areasData.data);
      }

      if (storesResponse.ok) {
        const storesData = await storesResponse.json();
        setStores(storesData.data);
      }
    } catch (error) {
      console.error("Failed to fetch areas/stores:", error);
    }
  };

  const handleReviewApplication = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch("/api/admin/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          action: reviewAction,
          notes: reviewNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setSuccess(`Application ${reviewAction}d successfully!`);
      setShowReviewDialog(false);
      setSelectedApplication(null);
      setReviewNotes("");
      fetchApplications();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const downloadDocument = async (
    applicationId: string,
    documentType: string,
    filename: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/applications/${applicationId}/documents/${documentType}`
      );
      if (!response.ok) throw new Error("Failed to download document");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setError(`Failed to download document: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "APPROVED":
        return <Badge variant="default">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getServiceAreaNames = (serviceAreaIds?: string[]) => {
    if (!serviceAreaIds?.length) return "None";
    return serviceAreaIds
      .map((id) => serviceAreas.find((area) => area.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const getStoreName = (storeId?: string) => {
    if (!storeId) return "None";
    const store = stores.find((s) => s.id === storeId);
    return store ? `${store.name} (${store.code})` : "Unknown Store";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-gray-600">Review and approve user applications</p>
        </div>
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
          <CardTitle>All Applications</CardTitle>
          <CardDescription>
            Review and manage user applications ({applications.length} total)
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
                  <TableHead>Applicant</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {application.fullName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {application.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {application.phoneNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {application.role === "STORE_MANAGER"
                        ? "Store Manager"
                        : "Rider"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {application.role === "RIDER"
                        ? getServiceAreaNames(
                            application.invitation.serviceAreas
                          )
                        : getStoreName(application.storeId)}
                    </TableCell>
                    <TableCell>{getStatusBadge(application.status)}</TableCell>
                    <TableCell>
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription>
                                Review application from {application.fullName}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Personal Info */}
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Personal Information
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <p>
                                    <strong>Name:</strong>{" "}
                                    {application.fullName}
                                  </p>
                                  <p>
                                    <strong>Email:</strong> {application.email}
                                  </p>
                                  <p>
                                    <strong>Phone:</strong>{" "}
                                    {application.phoneNumber}
                                  </p>
                                  <p>
                                    <strong>Role:</strong>{" "}
                                    {application.role === "STORE_MANAGER"
                                      ? "Store Manager"
                                      : "Rider"}
                                  </p>
                                </CardContent>
                              </Card>

                              {/* Role Specific Info */}
                              {application.role === "RIDER" && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">
                                      Rider Details
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <p>
                                      <strong>Vehicle Type:</strong>{" "}
                                      {application.vehicleType}
                                    </p>
                                    <p>
                                      <strong>Vehicle Number:</strong>{" "}
                                      {application.vehicleNumber}
                                    </p>
                                    <p>
                                      <strong>License Number:</strong>{" "}
                                      {application.licenseNumber}
                                    </p>
                                    <p>
                                      <strong>Service Areas:</strong>{" "}
                                      {getServiceAreaNames(
                                        application.invitation.serviceAreas
                                      )}
                                    </p>
                                  </CardContent>
                                </Card>
                              )}

                              {application.role === "STORE_MANAGER" && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">
                                      Store Manager Details
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <p>
                                      <strong>Assigned Store:</strong>{" "}
                                      {getStoreName(application.storeId)}
                                    </p>
                                  </CardContent>
                                </Card>
                              )}

                              {/* Documents */}
                              {application.documents &&
                                Object.keys(application.documents).length >
                                  0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Documents
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(
                                          application.documents
                                        ).map(([type, filename]) => (
                                          <Button
                                            key={type}
                                            variant="outline"
                                            onClick={() =>
                                              downloadDocument(
                                                application.id,
                                                type,
                                                filename
                                              )
                                            }
                                            className="justify-start"
                                          >
                                            <Download className="w-4 h-4 mr-2" />
                                            {type
                                              .replace(/([A-Z])/g, " $1")
                                              .replace(/^./, (str) =>
                                                str.toUpperCase()
                                              )}
                                          </Button>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                              {/* Map for Service Areas */}
                              {application.role === "RIDER" &&
                                application.invitation.serviceAreas?.length && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Service Areas
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="h-64 rounded-lg overflow-hidden border">
                                        <MapIntegration
                                          center={{
                                            latitude:
                                              serviceAreas.find((area) =>
                                                application.invitation.serviceAreas?.includes(
                                                  area.id
                                                )
                                              )?.centerLat || 29.5818,
                                            longitude:
                                              serviceAreas.find((area) =>
                                                application.invitation.serviceAreas?.includes(
                                                  area.id
                                                )
                                              )?.centerLng || 74.3294,
                                          }}
                                          zoom={10}
                                          markers={serviceAreas
                                            .filter((area) =>
                                              application.invitation.serviceAreas?.includes(
                                                area.id
                                              )
                                            )
                                            .map((area) => ({
                                              id: area.id,
                                              latitude: area.centerLat,
                                              longitude: area.centerLng,
                                              title: area.name,
                                              address: `${area.city}, ${area.state}`,
                                              type: "shop" as const,
                                            }))}
                                          height="250px"
                                        />
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                              {/* Map for Store Location */}
                              {application.role === "STORE_MANAGER" &&
                                application.storeId && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Store Location
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="h-64 rounded-lg overflow-hidden border">
                                        {(() => {
                                          const store = stores.find(
                                            (s) => s.id === application.storeId
                                          );
                                          return store ? (
                                            <MapIntegration
                                              center={{
                                                latitude: store.latitude,
                                                longitude: store.longitude,
                                              }}
                                              zoom={15}
                                              markers={[
                                                {
                                                  id: store.id,
                                                  latitude: store.latitude,
                                                  longitude: store.longitude,
                                                  title: store.name,
                                                  address: store.address,
                                                  type: "shop" as const,
                                                },
                                              ]}
                                              height="250px"
                                            />
                                          ) : null;
                                        })()}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {application.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(application);
                                setReviewAction("approve");
                                setShowReviewDialog(true);
                              }}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedApplication(application);
                                setReviewAction("reject");
                                setShowReviewDialog(true);
                              }}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
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

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"} Application
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "This will create an account for the applicant and send them login credentials."
                : "This will reject the application. The applicant will be notified."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about your decision..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReviewApplication}
                variant={reviewAction === "approve" ? "default" : "destructive"}
              >
                {reviewAction === "approve" ? "Approve" : "Reject"} Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
