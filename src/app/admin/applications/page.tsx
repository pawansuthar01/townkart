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
  Download,
  MapPin,
  FileText,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { MapIntegration } from "@/components/shared/MapIntegration";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    serviceAreas: string[];
    stores?: string[];
    token?: string;
    store?: Store;
  } | null;
}

interface StoreVerification {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  phoneNumber: string;
  email: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  applicationStatus: string;
  isVerified: boolean;
  manager: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string;
  } | null;
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
  const [activeTab, setActiveTab] = useState<
    "riders" | "storeManagers" | "storeVerification"
  >("riders");

  // For riders
  const [ridersData, setRidersData] = useState<Application[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [ridersError, setRidersError] = useState("");
  const [ridersPagination, setRidersPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [ridersSearch, setRidersSearch] = useState("");
  const [ridersStatusFilter, setRidersStatusFilter] = useState("all");

  // For storeManagers
  const [storeManagersData, setStoreManagersData] = useState<Application[]>([]);
  const [storeManagersLoading, setStoreManagersLoading] = useState(false);
  const [storeManagersError, setStoreManagersError] = useState("");
  const [storeManagersPagination, setStoreManagersPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [storeManagersSearch, setStoreManagersSearch] = useState("");
  const [storeManagersStatusFilter, setStoreManagersStatusFilter] =
    useState("all");

  // For storeVerification
  const [storeVerificationData, setStoreVerificationData] = useState<
    StoreVerification[]
  >([]);
  const [storeVerificationLoading, setStoreVerificationLoading] =
    useState(false);
  const [storeVerificationError, setStoreVerificationError] = useState("");
  const [storeVerificationPagination, setStoreVerificationPagination] =
    useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [storeVerificationSearch, setStoreVerificationSearch] = useState("");
  const [storeVerificationStatusFilter, setStoreVerificationStatusFilter] =
    useState("all");

  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedItem, setSelectedItem] = useState<
    Application | StoreVerification | null
  >(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchServiceAreasAndStores();
  }, []);

  useEffect(() => {
    if (activeTab === "riders") {
      fetchRiders();
    } else if (activeTab === "storeManagers") {
      fetchStoreManagers();
    } else if (activeTab === "storeVerification") {
      fetchStoreVerification();
    }
  }, [activeTab]);

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
      // silent
    }
  };

  const fetchRiders = async () => {
    setRidersLoading(true);
    setRidersError("");
    try {
      const params = new URLSearchParams({
        role: "RIDER",
        page: ridersPagination.page.toString(),
        limit: ridersPagination.limit.toString(),
        q: ridersSearch,
      });
      const statusParam =
        ridersStatusFilter === "all" ? "" : ridersStatusFilter;
      if (statusParam) params.set("status", statusParam);
      const response = await fetch(`/api/admin/applications?${params}`);
      if (!response.ok) throw new Error("Failed to fetch riders");

      const data = await response.json();
      setRidersData(data.applications);
      setRidersPagination(data.pagination);
    } catch (error: any) {
      setRidersError(error.message);
    } finally {
      setRidersLoading(false);
    }
  };

  const fetchStoreManagers = async () => {
    setStoreManagersLoading(true);
    setStoreManagersError("");
    try {
      const params = new URLSearchParams({
        role: "STORE_MANAGER",
        page: storeManagersPagination.page.toString(),
        limit: storeManagersPagination.limit.toString(),
        q: storeManagersSearch,
      });
      const statusParam =
        storeManagersStatusFilter === "all" ? "" : storeManagersStatusFilter;
      if (statusParam) params.set("status", statusParam);
      const response = await fetch(`/api/admin/applications?${params}`);

      const data = await response.json();
      if (!response.ok) throw new Error("Failed to fetch store managers");
      setStoreManagersData(data.applications);
      setStoreManagersPagination(data.pagination);
    } catch (error: any) {
      setStoreManagersError(error.message);
    } finally {
      setStoreManagersLoading(false);
    }
  };

  const fetchStoreVerification = async () => {
    setStoreVerificationLoading(true);
    setStoreVerificationError("");
    try {
      const params = new URLSearchParams({
        type: "STORE",
        page: storeVerificationPagination.page.toString(),
        limit: storeVerificationPagination.limit.toString(),
        q: storeVerificationSearch,
      });
      const statusParam =
        storeVerificationStatusFilter === "all"
          ? ""
          : storeVerificationStatusFilter;
      if (statusParam) params.set("status", statusParam);
      const response = await fetch(`/api/admin/applications?${params}`);
      if (!response.ok) throw new Error("Failed to fetch store verification");

      const data = await response.json();
      setStoreVerificationData(data.stores);
      setStoreVerificationPagination(data.pagination);
    } catch (error: any) {
      setStoreVerificationError(error.message);
    } finally {
      setStoreVerificationLoading(false);
    }
  };

  const handleReview = async () => {
    if (!selectedItem) return;

    try {
      const type = activeTab === "storeVerification" ? "STORE" : "APPLICATION";
      const response = await fetch("/api/admin/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem.id,
          type,
          action: reviewAction,
          notes: reviewNotes,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      setSuccess(
        `${type === "STORE" ? "Store verification" : "Application"} ${reviewAction}d successfully!`
      );
      setShowReviewDialog(false);
      setSelectedItem(null);
      setReviewNotes("");
      // Refresh current tab
      if (activeTab === "riders") fetchRiders();
      else if (activeTab === "storeManagers") fetchStoreManagers();
      else fetchStoreVerification();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const downloadDocument = async (
    id: string,
    documentType: string,
    filename: string
  ) => {
    try {
      const response = await fetch(
        `/api/admin/applications/${id}/documents/${documentType}`
      );
      console.log(response);
      if (!response.ok) {
        return;
      }

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

  const renderTable = (
    data: Application[] | StoreVerification[],
    loading: boolean,
    error: string,
    type: "application" | "store"
  ) => {
    if (loading)
      return (
        <div className="flex justify-center py-8">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      );
    if (error)
      return (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );

    if (type === "application") {
      const apps = data as Application[];
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="hidden sm:table-cell">Assignment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{app.fullName}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {app.email}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {app.phoneNumber}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {app.role === "STORE_MANAGER" ? "Store Manager" : "Rider"}
                </TableCell>
                <TableCell className="text-sm text-gray-600 hidden sm:table-cell">
                  {app.role === "RIDER"
                    ? app.invitation?.serviceAreas
                      ? getServiceAreaNames(app.invitation.serviceAreas)
                      : "Direct Application"
                    : getStoreName(app.storeId)}
                </TableCell>
                <TableCell>{getStatusBadge(app.status)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {new Date(app.submittedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(app);
                        setShowViewDialog(true);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    {app.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(app);
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
                            setSelectedItem(app);
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
      );
    } else {
      const stores = data as StoreVerification[];
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Owner Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((store) => (
              <TableRow key={store.id}>
                <TableCell>{store.name}</TableCell>
                <TableCell>{store.code}</TableCell>
                <TableCell>{store.city}</TableCell>
                <TableCell>{store.manager?.phoneNumber || "N/A"}</TableCell>
                <TableCell>{getStatusBadge(store.applicationStatus)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedItem(store);
                        setShowViewDialog(true);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    {store.applicationStatus === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedItem(store);
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
                            setSelectedItem(store);
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
      );
    }
  };

  const renderViewDialog = () => {
    if (!selectedItem) return null;
    if ("role" in selectedItem) {
      // Application
      const app = selectedItem as Application;
      return (
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review application from {app.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Name:</strong> {app.fullName}
                </p>
                <p>
                  <strong>Email:</strong> {app.email}
                </p>
                <p>
                  <strong>Phone:</strong> {app.phoneNumber}
                </p>
                <p>
                  <strong>Role:</strong>{" "}
                  {app.role === "STORE_MANAGER" ? "Store Manager" : "Rider"}
                </p>
              </CardContent>
            </Card>
            {app.role === "RIDER" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rider Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <strong>Vehicle Type:</strong> {app.vehicleType}
                  </p>
                  <p>
                    <strong>Vehicle Number:</strong> {app.vehicleNumber}
                  </p>
                  <p>
                    <strong>License Number:</strong> {app.licenseNumber}
                  </p>
                  <p>
                    <strong>Service Areas:</strong>{" "}
                    {app.invitation?.serviceAreas
                      ? getServiceAreaNames(app.invitation.serviceAreas)
                      : "Direct Application - Will be assigned to default service area"}
                  </p>
                </CardContent>
              </Card>
            )}
            {app.role === "STORE_MANAGER" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Store Manager Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <strong>Assigned Store:</strong> {getStoreName(app.storeId)}
                  </p>
                </CardContent>
              </Card>
            )}
            {app.documents && Object.keys(app.documents).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(app.documents).map(([type, filename]) => (
                      <Button
                        key={type}
                        variant="outline"
                        onClick={() => downloadDocument(app.id, type, filename)}
                        className="justify-start"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {type
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {app.role === "RIDER" && app.invitation?.serviceAreas?.length && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Service Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 rounded-lg overflow-hidden border">
                    {app.invitation?.serviceAreas ? (
                      <MapIntegration
                        center={{
                          latitude:
                            serviceAreas.find((area) =>
                              app.invitation?.serviceAreas?.includes(area.id)
                            )?.centerLat || 29.5818,
                          longitude:
                            serviceAreas.find((area) =>
                              app.invitation?.serviceAreas?.includes(area.id)
                            )?.centerLng || 74.3294,
                        }}
                        zoom={10}
                        markers={serviceAreas
                          .filter((area) =>
                            app.invitation?.serviceAreas?.includes(area.id)
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
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <p>
                          Direct application - will be assigned to default
                          service area upon approval
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {app.role === "STORE_MANAGER" && app.storeId && (
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
                      const store = stores.find((s) => s.id === app.storeId);
                      return store ? (
                        <MapIntegration
                          center={{
                            latitude: store.latitude || 29.5818,
                            longitude: store.longitude || 74.3294,
                          }}
                          zoom={15}
                          markers={[
                            {
                              id: store.id,
                              latitude: store.latitude || 29.5818,
                              longitude: store.longitude || 74.3294,
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
      );
    } else {
      // Store
      const store = selectedItem as StoreVerification;
      return (
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Store Verification Details</DialogTitle>
            <DialogDescription>
              Review store verification for {store.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Store Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>
                  <strong>Name:</strong> {store.name}
                </p>
                <p>
                  <strong>Code:</strong> {store.code}
                </p>
                <p>
                  <strong>Address:</strong> {store.address}
                </p>
                <p>
                  <strong>City:</strong> {store.city}
                </p>
                <p>
                  <strong>State:</strong> {store.state}
                </p>
                <p>
                  <strong>Phone:</strong> {store.phoneNumber}
                </p>
                <p>
                  <strong>Email:</strong> {store.email}
                </p>
              </CardContent>
            </Card>
            {store.manager && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Owner Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>
                    <strong>Name:</strong> {store.manager.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {store.manager.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {store.manager.phoneNumber}
                  </p>
                </CardContent>
              </Card>
            )}
            {store.latitude && store.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Store Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 rounded-lg overflow-hidden border">
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
                          address: store.address || "",
                          type: "shop" as const,
                        },
                      ]}
                      height="250px"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Applications Management</h1>
          <p className="text-gray-600">
            Review and manage rider, store manager, and store verification
            applications
          </p>
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
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
      >
        <TabsList>
          <TabsTrigger value="riders">Rider Applications</TabsTrigger>
          <TabsTrigger value="storeManagers">
            Store Manager Applications
          </TabsTrigger>
          <TabsTrigger value="storeVerification">
            Store Verification
          </TabsTrigger>
        </TabsList>
        <TabsContent value="riders">
          <Card>
            <CardHeader>
              <CardTitle>Rider Applications</CardTitle>
              <CardDescription>
                Review rider applications ({ridersData.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Search..."
                  value={ridersSearch}
                  onChange={(e) => setRidersSearch(e.target.value)}
                />
                <Select
                  value={ridersStatusFilter}
                  onValueChange={setRidersStatusFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchRiders}>Search</Button>
              </div>
              <div className="overflow-x-auto">
                {renderTable(
                  ridersData,
                  ridersLoading,
                  ridersError,
                  "application"
                )}
              </div>
              <div className="flex justify-between items-center mt-4">
                <Button
                  disabled={ridersPagination.page <= 1}
                  onClick={() => {
                    setRidersPagination((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }));
                    fetchRiders();
                  }}
                >
                  Previous
                </Button>
                <span>
                  Page {ridersPagination.page} of {ridersPagination.pages}
                </span>
                <Button
                  disabled={ridersPagination.page >= ridersPagination.pages}
                  onClick={() => {
                    setRidersPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }));
                    fetchRiders();
                  }}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="storeManagers">
          <Card>
            <CardHeader>
              <CardTitle>Store Manager Applications</CardTitle>
              <CardDescription>
                Review store manager applications ({storeManagersData.length}{" "}
                total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Search..."
                  value={storeManagersSearch}
                  onChange={(e) => setStoreManagersSearch(e.target.value)}
                />
                <Select
                  value={storeManagersStatusFilter}
                  onValueChange={setStoreManagersStatusFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchStoreManagers}>Search</Button>
              </div>
              <div className="overflow-x-auto">
                {renderTable(
                  storeManagersData,
                  storeManagersLoading,
                  storeManagersError,
                  "application"
                )}
              </div>
              <div className="flex justify-between items-center mt-4">
                <Button
                  disabled={storeManagersPagination.page <= 1}
                  onClick={() => {
                    setStoreManagersPagination((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }));
                    fetchStoreManagers();
                  }}
                >
                  Previous
                </Button>
                <span>
                  Page {storeManagersPagination.page} of{" "}
                  {storeManagersPagination.pages}
                </span>
                <Button
                  disabled={
                    storeManagersPagination.page >=
                    storeManagersPagination.pages
                  }
                  onClick={() => {
                    setStoreManagersPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }));
                    fetchStoreManagers();
                  }}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="storeVerification">
          <Card>
            <CardHeader>
              <CardTitle>Store Verification Applications</CardTitle>
              <CardDescription>
                Review store verification applications (
                {storeVerificationData.length} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Input
                  placeholder="Search..."
                  value={storeVerificationSearch}
                  onChange={(e) => setStoreVerificationSearch(e.target.value)}
                />
                <Select
                  value={storeVerificationStatusFilter}
                  onValueChange={setStoreVerificationStatusFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchStoreVerification}>Search</Button>
              </div>
              <div className="overflow-x-auto">
                {renderTable(
                  storeVerificationData,
                  storeVerificationLoading,
                  storeVerificationError,
                  "store"
                )}
              </div>
              <div className="flex justify-between items-center mt-4">
                <Button
                  disabled={storeVerificationPagination.page <= 1}
                  onClick={() => {
                    setStoreVerificationPagination((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }));
                    fetchStoreVerification();
                  }}
                >
                  Previous
                </Button>
                <span>
                  Page {storeVerificationPagination.page} of{" "}
                  {storeVerificationPagination.pages}
                </span>
                <Button
                  disabled={
                    storeVerificationPagination.page >=
                    storeVerificationPagination.pages
                  }
                  onClick={() => {
                    setStoreVerificationPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }));
                    fetchStoreVerification();
                  }}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        {renderViewDialog()}
      </Dialog>
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "approve" ? "Approve" : "Reject"}{" "}
              {activeTab === "storeVerification"
                ? "Store Verification"
                : "Application"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approve"
                ? "This will approve the application."
                : "This will reject the application."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
              <Textarea
                id="reviewNotes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes..."
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
                onClick={handleReview}
                variant={reviewAction === "approve" ? "default" : "destructive"}
              >
                {reviewAction === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
