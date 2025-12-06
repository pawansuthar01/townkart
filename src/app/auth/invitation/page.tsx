"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  FileText,
  Store,
  Bike,
  Info,
  Upload,
  X,
} from "lucide-react";

interface InvitationData {
  id: string;
  role: string;
  invitedEmail: string;
  invitedPhone?: string;
  message?: string;
  storeId?: string;
  serviceAreas: string[];
  stores: string[];
  expiresAt: string;
}

interface ExistingUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  userRoles: string[];
}

export default function InvitationAcceptancePage() {
  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );
  const [existingUser, setExistingUser] = useState<ExistingUser | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    // Rider specific
    vehicleType: "bike",
    vehicleNumber: "",
    licenseNumber: "",
    emergencyContact: "",
    emergencyPhone: "",
    documents: [] as File[],
    // Store manager specific
    selectedStoreId: "",
  });

  const [stores, setStores] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setError("Invalid invitation link");
      setIsValidating(false);
    }
  }, [token]);

  const validateInvitation = async () => {
    try {
      const response = await fetch(
        `/api/auth/validate-invitation?token=${token}`
      );
      const data = await response.json();

      if (data.valid) {
        setInvitationData(data.invitation);
        // Check if email/phone is already registered
        await checkExistingUser(
          data.invitation.invitedEmail,
          data.invitation.invitedPhone
        );
      } else {
        setError(data.message || "Invalid invitation");
      }
    } catch (error) {
      setError("Failed to validate invitation");
    } finally {
      setIsValidating(false);
    }
  };

  const checkExistingUser = async (email: string, phone?: string) => {
    try {
      const response = await fetch("/api/auth/check-existing-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setExistingUser(data.user);
          setShowDeleteDialog(true);
        } else {
          setShowRoleForm(true);
          if (invitationData?.role === "STORE_MANAGER") {
            await fetchStores();
          }
        }
      }
    } catch (error) {
      console.error("Failed to check existing user:", error);
      setShowRoleForm(true);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/admin/stores?limit=1000");
      if (response.ok) {
        const data = await response.json();
        setStores(data.data || []);
        // Pre-select store if specified in invitation
        if (invitationData?.storeId) {
          setFormData((prev) => ({
            ...prev,
            selectedStoreId: invitationData.storeId!,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    }
  };

  const handleDeleteExistingAccount = async () => {
    if (!existingUser) return;

    try {
      const response = await fetch(`/api/auth/delete-existing-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: existingUser.id,
          reason: "Account deletion for invitation acceptance",
        }),
      });

      if (response.ok) {
        setShowDeleteDialog(false);
        setExistingUser(null);
        setShowRoleForm(true);
        if (invitationData?.role === "STORE_MANAGER") {
          await fetchStores();
        }
      } else {
        setError("Failed to delete existing account");
      }
    } catch (error) {
      setError("Failed to delete existing account");
    }
  };

  const handleFileUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...fileArray],
    }));
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "Full name is required";
    if (!formData.phoneNumber.trim()) return "Phone number is required";
    if (!formData.password) return "Password is required";
    if (!formData.confirmPassword) return "Please confirm your password";
    if (formData.password !== formData.confirmPassword)
      return "Passwords do not match";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters";

    if (invitationData?.role === "RIDER") {
      if (!formData.vehicleNumber.trim()) return "Vehicle number is required";
      if (!formData.licenseNumber.trim()) return "License number is required";
      if (!formData.emergencyContact.trim())
        return "Emergency contact is required";
      if (!formData.emergencyPhone.trim()) return "Emergency phone is required";
      if (formData.documents.length === 0)
        return "At least one document is required";
    }

    if (invitationData?.role === "STORE_MANAGER") {
      if (!formData.selectedStoreId) return "Please select a store";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("token", token!);
      submitData.append("fullName", formData.fullName);
      submitData.append("phoneNumber", formData.phoneNumber);
      submitData.append("password", formData.password);
      submitData.append("role", invitationData!.role);

      if (invitationData?.role === "RIDER") {
        submitData.append("vehicleType", formData.vehicleType);
        submitData.append("vehicleNumber", formData.vehicleNumber);
        submitData.append("licenseNumber", formData.licenseNumber);
        submitData.append("emergencyContact", formData.emergencyContact);
        submitData.append("emergencyPhone", formData.emergencyPhone);

        formData.documents.forEach((doc, index) => {
          submitData.append(`documents`, doc);
        });
      }

      if (invitationData?.role === "STORE_MANAGER") {
        submitData.append("storeId", formData.selectedStoreId);
      }

      const response = await fetch("/api/auth/accept-invitation", {
        method: "POST",
        body: submitData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(
          "Account created successfully! Your application is pending approval."
        );
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create account");
      }
    } catch (error) {
      setError("Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner className="w-8 h-8 mx-auto mb-4" />
          <p>Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")} className="w-full mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {invitationData?.role === "RIDER" && (
              <Bike className="w-12 h-12 text-blue-600" />
            )}
            {invitationData?.role === "STORE_MANAGER" && (
              <Store className="w-12 h-12 text-green-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            Join as{" "}
            {invitationData?.role === "STORE_MANAGER"
              ? "Store Manager"
              : "Rider"}
          </CardTitle>
          <CardDescription>
            Complete your registration to join the TownKart team
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {invitationData && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">
                    You've been invited to join as a{" "}
                    {invitationData.role === "STORE_MANAGER"
                      ? "Store Manager"
                      : "Rider"}
                  </p>
                  {invitationData.message && (
                    <p className="text-sm">{invitationData.message}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {showRoleForm && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="+919876543210"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role-specific fields */}
              {invitationData?.role === "RIDER" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Bike className="w-5 h-5" />
                    Rider Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="vehicleType">Vehicle Type</Label>
                      <Select
                        value={formData.vehicleType}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            vehicleType: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bike">Bike</SelectItem>
                          <SelectItem value="scooter">Scooter</SelectItem>
                          <SelectItem value="car">Car</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                      <Input
                        id="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            vehicleNumber: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            licenseNumber: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="emergencyContact">
                        Emergency Contact Name
                      </Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            emergencyContact: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="emergencyPhone">
                      Emergency Contact Phone
                    </Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      placeholder="+919876543210"
                      value={formData.emergencyPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          emergencyPhone: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  {/* Document Upload */}
                  <div>
                    <Label>
                      Documents (License, Vehicle Registration, etc.)
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={(e) =>
                          e.target.files && handleFileUpload(e.target.files)
                        }
                        className="hidden"
                        id="document-upload"
                      />
                      <label
                        htmlFor="document-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload documents
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB each
                        </p>
                      </label>
                    </div>

                    {formData.documents.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {formData.documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-2 rounded"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">{doc.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {invitationData?.role === "STORE_MANAGER" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Store Assignment
                  </h3>

                  <div>
                    <Label htmlFor="storeSelect">Select Store</Label>
                    <Select
                      value={formData.selectedStoreId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          selectedStoreId: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a store to manage" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name} ({store.code}) - {store.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Creating Account...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Delete Existing Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Existing Account Found</DialogTitle>
            <DialogDescription>
              An account with email {invitationData?.invitedEmail} or phone{" "}
              {invitationData?.invitedPhone} already exists. To accept this
              invitation, you need to delete the existing account and create a
              new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDeleteExistingAccount}>
              Delete & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
